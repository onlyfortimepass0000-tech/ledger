import { getSql } from "../server/db.js";
import { route } from "../server/http.js";
import type { InventoryResponse, InventoryRow } from "../shared/types";

type Row = Omit<InventoryRow, "isLow">;

export default route({
  GET: async (): Promise<InventoryResponse> => {
    const sql = getSql();
    const rows = await sql<Row[]>`
      SELECT id, name, unit, current_stock, low_stock_threshold, last_change,
             (extract(epoch FROM (now() - last_changed_at)))::float8 AS changed_seconds_ago
      FROM ingredients
      ORDER BY name
    `;
    return {
      ingredients: rows.map((r) => ({ ...r, isLow: r.currentStock <= r.lowStockThreshold })),
    };
  },
});
