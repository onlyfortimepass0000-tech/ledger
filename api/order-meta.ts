import { getSql } from "../server/db";
import { route } from "../server/http";
import { CAFE_TIMEZONE } from "../shared/cafe";
import type { OrderMeta } from "../shared/types";

export default route({
  GET: async (): Promise<OrderMeta> => {
    const sql = getSql();
    const rows = await sql<{ nextSerialNo: number }[]>`
      SELECT (COALESCE(MAX(serial_no), 0) + 1)::int AS next_serial_no
      FROM orders
      WHERE (created_at AT TIME ZONE ${CAFE_TIMEZONE})::date
          = (now() AT TIME ZONE ${CAFE_TIMEZONE})::date
    `;
    const dateLabel = new Date().toLocaleDateString("en-GB", {
      timeZone: CAFE_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    return { nextSerialNo: rows[0]?.nextSerialNo ?? 1, dateLabel };
  },
});
