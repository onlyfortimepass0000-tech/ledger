import type {
  AdjustInput,
  AdjustResponse,
  AnalyticsPeriod,
  AnalyticsResult,
  InventoryResponse,
  MenuResponse,
  OrderInput,
  OrderMeta,
  OrderResult,
} from "../../shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, init);
  } catch {
    throw new Error("Can't reach the server. Please check the internet connection.");
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // not JSON (e.g. a platform error page); handled below
  }
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(message ?? `Server error (${res.status}). Please try again.`);
  }
  if (data === null) throw new Error("The server sent an empty answer. Please try again.");
  return data as T;
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const getMenu = () => request<MenuResponse>("menu");
export const getInventory = () => request<InventoryResponse>("inventory");
export const getOrderMeta = () => request<OrderMeta>("order-meta");
export const getAnalytics = (period: AnalyticsPeriod) =>
  request<AnalyticsResult>(`analytics?period=${encodeURIComponent(period)}`);
export const postOrder = (input: OrderInput) => request<OrderResult>("orders", post(input));
export const postInventoryAdjust = (input: AdjustInput) =>
  request<AdjustResponse>("inventory-adjust", post(input));
