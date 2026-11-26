// Cafe-wide constants shared by the counter UI and the API.

/** The cafe's day runs on Indian time: the serial number restarts at midnight IST. */
export const CAFE_TIMEZONE = "Asia/Kolkata";

/** Tables shown in the table picker (T-1 … T-N). Change this if the cafe has more or fewer. */
export const TABLE_COUNT = 10;

export function formatTable(n: number | null | undefined): string {
  return n ? `T-${n}` : "Counter";
}
