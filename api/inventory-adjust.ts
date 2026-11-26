import { z } from "zod";
import { getSql } from "../server/db.js";
import { HttpError, route, round2 } from "../server/http.js";
import type { AdjustResponse, InventoryRow } from "../shared/types";

const schema = z.object({
  ingredientId: z.number().int().positive(),
  mode: z.enum(["set", "add"]),
  amount: z.number().finite().min(-1_000_000).max(1_000_000),
  note: z.string().max(200).optional(),
});

type Row = Omit<InventoryRow, "isLow" | "changedSecondsAgo">;

export default route({
  POST: async (req): Promise<AdjustResponse> => {
    const input = schema.parse(req.body);
    const sql = getSql();

    return sql.begin(async (tx) => {
      const found = await tx<Row[]>`
        SELECT id, name, unit, current_stock, low_stock_threshold, last_change
        FROM ingredients WHERE id = ${input.ingredientId} FOR UPDATE
      `;
      const ing = found[0];
      if (!ing) throw new HttpError(404, "Ingredient not found");

      const current = ing.currentStock;
      let newStock: number;
      let change: number;
      let reason: string;
      if (input.mode === "set") {
        if (input.amount < 0) throw new HttpError(400, "Stock cannot be set to a negative value");
        newStock = round2(input.amount);
        change = round2(newStock - current);
        reason = "adjustment";
      } else {
        change = round2(input.amount);
        newStock = round2(current + change);
        reason = change >= 0 ? "restock" : "adjustment";
      }
      if (newStock < 0) throw new HttpError(400, "Stock cannot go below zero");

      await tx`
        UPDATE ingredients
        SET current_stock = ${newStock}, last_change = ${change}, last_changed_at = now()
        WHERE id = ${input.ingredientId}
      `;
      if (change !== 0) {
        await tx`
          INSERT INTO inventory_transactions (ingredient_id, change, reason, note)
          VALUES (${input.ingredientId}, ${change}, ${reason}, ${input.note ?? null})
        `;
      }

      return {
        ingredient: {
          ...ing,
          currentStock: newStock,
          lastChange: change,
          changedSecondsAgo: 0,
          isLow: newStock <= ing.lowStockThreshold,
        },
      };
    });
  },
});
