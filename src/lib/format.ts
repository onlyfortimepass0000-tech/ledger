export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function formatINR(value: number | string | null | undefined): string {
  const n = toNumber(value);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatQty(value: number | string | null | undefined, unit: string): string {
  const n = Math.round(toNumber(value) * 100) / 100;
  return `${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit}`;
}
