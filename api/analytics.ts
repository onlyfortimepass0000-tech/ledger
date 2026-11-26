import { z } from "zod";
import { getSql } from "../server/db";
import { route } from "../server/http";
import { CAFE_TIMEZONE } from "../shared/cafe";
import type {
  AnalyticsPeriod,
  AnalyticsResult,
  ConsumptionDriver,
  IngredientConsumption,
  SalesSummary,
  TopItem,
} from "../shared/types";

const schema = z.object({ period: z.enum(["today", "week", "month"]).default("week") });

type Sql = ReturnType<typeof getSql>;

// "Today" is the cafe's day: it starts at midnight India time, the same moment
// the Sr. No. restarts at 1. Computed in SQL so there is one definition of a day.
async function startOf(sql: Sql, period: AnalyticsPeriod): Promise<Date> {
  if (period === "today") {
    const rows = await sql<{ startOfDay: Date }[]>`
      SELECT (date_trunc('day', now() AT TIME ZONE ${CAFE_TIMEZONE}) AT TIME ZONE ${CAFE_TIMEZONE}) AS start_of_day
    `;
    return new Date(rows[0].startOfDay);
  }
  const days = period === "week" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default route({
  GET: async (req): Promise<AnalyticsResult> => {
    const raw = Array.isArray(req.query.period) ? req.query.period[0] : req.query.period;
    const { period } = schema.parse({ period: raw });
    const sql = getSql();
    const start = await startOf(sql, period);

    const salesRows = await sql<SalesSummary[]>`
      SELECT COALESCE(SUM(total_amount), 0)::float8 AS revenue,
             COUNT(*)::int AS order_count,
             COALESCE(SUM(item_count), 0)::int AS items_sold
      FROM orders
      WHERE created_at >= ${start}
    `;

    const topItems = await sql<TopItem[]>`
      SELECT oi.menu_item_id, oi.name_snapshot AS name,
             SUM(oi.quantity)::int AS quantity, SUM(oi.line_total)::float8 AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= ${start}
      GROUP BY oi.menu_item_id, oi.name_snapshot
      ORDER BY SUM(oi.quantity) DESC
      LIMIT 8
    `;

    const consumption = await sql<
      {
        ingredientId: number;
        ingName: string;
        unit: string;
        menuItemId: number | null;
        itemName: string;
        consumed: number;
      }[]
    >`
      SELECT it.ingredient_id, ing.name AS ing_name, ing.unit AS unit,
             it.menu_item_id, COALESCE(mi.name, '(deleted item)') AS item_name,
             SUM(-it.change)::float8 AS consumed
      FROM inventory_transactions it
      JOIN ingredients ing ON ing.id = it.ingredient_id
      LEFT JOIN menu_items mi ON mi.id = it.menu_item_id
      WHERE it.reason = 'order_consumption' AND it.created_at >= ${start}
      GROUP BY it.ingredient_id, ing.name, ing.unit, it.menu_item_id, mi.name
    `;

    const byIngredient = new Map<number, IngredientConsumption>();
    for (const r of consumption) {
      let entry = byIngredient.get(r.ingredientId);
      if (!entry) {
        entry = { ingredientId: r.ingredientId, name: r.ingName, unit: r.unit, consumed: 0, drivers: [] };
        byIngredient.set(r.ingredientId, entry);
      }
      entry.consumed = Math.round((entry.consumed + r.consumed) * 100) / 100;
      const driver: ConsumptionDriver = { menuItemId: r.menuItemId, name: r.itemName, consumed: r.consumed };
      entry.drivers.push(driver);
    }

    const ingredients = [...byIngredient.values()]
      .map((e) => ({ ...e, drivers: e.drivers.sort((a, b) => b.consumed - a.consumed) }))
      .sort((a, b) => b.consumed - a.consumed);

    return {
      period,
      startDate: start.toISOString(),
      sales: salesRows[0] ?? { revenue: 0, orderCount: 0, itemsSold: 0 },
      topItems: [...topItems],
      ingredients,
    };
  },
});
