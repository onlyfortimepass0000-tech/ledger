import { z } from "zod";
import { getSql } from "../server/db";
import { HttpError, route, round2 } from "../server/http";
import { CAFE_TIMEZONE } from "../shared/cafe";
import type { Deduction, OrderLine, OrderResult } from "../shared/types";

const schema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1, "Add at least one item")
    .max(50),
  tableNumber: z.number().int().min(1).max(99).nullable().optional(),
});

export default route({
  POST: async (req): Promise<OrderResult> => {
    const input = schema.parse(req.body);
    const tableNumber = input.tableNumber ?? null;

    // Collapse duplicate menu item ids into a single quantity.
    const qtyByMenuItem = new Map<number, number>();
    for (const row of input.items) {
      qtyByMenuItem.set(row.menuItemId, (qtyByMenuItem.get(row.menuItemId) ?? 0) + row.quantity);
    }
    const menuItemIds = [...qtyByMenuItem.keys()];

    const sql = getSql();

    // One transaction: the entry, its lines, the stock deductions and the
    // serial number all succeed together or not at all.
    return sql.begin(async (tx) => {
      const menuRows = await tx<{ id: number; name: string; price: number }[]>`
        SELECT id, name, price FROM menu_items
        WHERE id IN ${tx(menuItemIds)} AND is_active
      `;
      const menuById = new Map(menuRows.map((m) => [m.id, m]));

      const lines: OrderLine[] = [];
      let totalAmount = 0;
      let itemCount = 0;
      for (const [menuItemId, quantity] of qtyByMenuItem) {
        const m = menuById.get(menuItemId);
        if (!m) throw new HttpError(400, "One of the items is no longer on the menu");
        const lineTotal = round2(m.price * quantity);
        totalAmount += lineTotal;
        itemCount += quantity;
        lines.push({ menuItemId, name: m.name, quantity, unitPrice: m.price, lineTotal });
      }
      totalAmount = round2(totalAmount);

      // Day-wise serial number (Sr. No.). The advisory lock makes two counters
      // saving at the same instant take turns, so they never share a number.
      await tx`SELECT pg_advisory_xact_lock(7001)`;
      const serialRows = await tx<{ nextSerialNo: number }[]>`
        SELECT (COALESCE(MAX(serial_no), 0) + 1)::int AS next_serial_no
        FROM orders
        WHERE (created_at AT TIME ZONE ${CAFE_TIMEZONE})::date
            = (now() AT TIME ZONE ${CAFE_TIMEZONE})::date
      `;
      const serialNo = serialRows[0]?.nextSerialNo ?? 1;

      const orderRows = await tx<{ id: number }[]>`
        INSERT INTO orders (total_amount, item_count, serial_no, table_number)
        VALUES (${totalAmount}, ${itemCount}, ${serialNo}, ${tableNumber})
        RETURNING id
      `;
      const orderId = orderRows[0].id;

      await tx`
        INSERT INTO order_items ${tx(
          lines.map((l) => ({
            orderId,
            menuItemId: l.menuItemId,
            nameSnapshot: l.name,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
        )}
      `;

      // Deduct ingredients according to each item's recipe.
      const recipes = await tx<{ menuItemId: number; ingredientId: number; quantity: number }[]>`
        SELECT menu_item_id, ingredient_id, quantity FROM recipe_items
        WHERE menu_item_id IN ${tx(menuItemIds)}
      `;

      const consumedByIngredient = new Map<number, number>();
      const movements: {
        ingredientId: number;
        change: number;
        reason: string;
        orderId: number;
        menuItemId: number;
      }[] = [];

      for (const r of recipes) {
        const consumed = round2(r.quantity * (qtyByMenuItem.get(r.menuItemId) ?? 0));
        if (consumed === 0) continue;
        consumedByIngredient.set(
          r.ingredientId,
          round2((consumedByIngredient.get(r.ingredientId) ?? 0) + consumed),
        );
        movements.push({
          ingredientId: r.ingredientId,
          change: -consumed,
          reason: "order_consumption",
          orderId,
          menuItemId: r.menuItemId,
        });
      }

      if (movements.length > 0) {
        await tx`INSERT INTO inventory_transactions ${tx(movements)}`;
      }

      // Update in a stable order so two counters saving at once can't deadlock.
      const affectedIds = [...consumedByIngredient.keys()].sort((a, b) => a - b);
      for (const ingredientId of affectedIds) {
        const consumed = consumedByIngredient.get(ingredientId) ?? 0;
        await tx`
          UPDATE ingredients
          SET current_stock = current_stock - ${consumed},
              last_change = ${-consumed},
              last_changed_at = now()
          WHERE id = ${ingredientId}
        `;
      }

      const deductions: Deduction[] = [];
      if (affectedIds.length > 0) {
        const updated = await tx<
          { id: number; name: string; unit: string; currentStock: number; lowStockThreshold: number }[]
        >`
          SELECT id, name, unit, current_stock, low_stock_threshold
          FROM ingredients WHERE id IN ${tx(affectedIds)}
        `;
        for (const ing of updated) {
          deductions.push({
            ingredientId: ing.id,
            name: ing.name,
            unit: ing.unit,
            amount: consumedByIngredient.get(ing.id) ?? 0,
            remaining: ing.currentStock,
            low: ing.currentStock <= ing.lowStockThreshold,
          });
        }
        deductions.sort((a, b) => b.amount - a.amount);
      }

      return { orderId, serialNo, tableNumber, totalAmount, itemCount, lines, deductions };
    });
  },
});
