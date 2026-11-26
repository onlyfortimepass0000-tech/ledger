import { getSql } from "../server/db";
import { route } from "../server/http";
import type { MenuItem, MenuResponse } from "../shared/types";

export default route({
  GET: async (): Promise<MenuResponse> => {
    const sql = getSql();
    const items = await sql<MenuItem[]>`
      SELECT id, name, category, price, is_quick_tab, quick_tab_order, is_active
      FROM menu_items
      WHERE is_active
      ORDER BY category, quick_tab_order NULLS LAST, name
    `;
    return { items: [...items] };
  },
});
