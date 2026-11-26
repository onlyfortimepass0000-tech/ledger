// Shapes of the JSON the /api functions return. Used by both the server and the UI.

export type MenuItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  isQuickTab: boolean;
  quickTabOrder: number | null;
  isActive: boolean;
};

export type MenuResponse = { items: MenuItem[] };

export type InventoryRow = {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  lowStockThreshold: number;
  /** Signed amount of the last change (negative = used). */
  lastChange: number | null;
  /** Seconds since stock last changed (order or manual adjust); null if never. */
  changedSecondsAgo: number | null;
  isLow: boolean;
};

export type InventoryResponse = { ingredients: InventoryRow[] };

export type AdjustInput = {
  ingredientId: number;
  mode: "set" | "add";
  amount: number;
  note?: string;
};

export type AdjustResponse = { ingredient: InventoryRow };

export type OrderInput = {
  items: { menuItemId: number; quantity: number }[];
  /** T-1, T-2 …; null/omitted = no table (counter). */
  tableNumber?: number | null;
};

export type OrderLine = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Deduction = {
  ingredientId: number;
  name: string;
  unit: string;
  /** Amount used by this order (positive number). */
  amount: number;
  /** Stock left after this order. */
  remaining: number;
  low: boolean;
};

export type OrderResult = {
  orderId: number;
  /** The day's running serial number (Sr. No.). */
  serialNo: number;
  tableNumber: number | null;
  totalAmount: number;
  itemCount: number;
  lines: OrderLine[];
  deductions: Deduction[];
};

export type OrderMeta = {
  /** The serial number the next saved entry will get today (1, 2, 3 …). */
  nextSerialNo: number;
  /** Today's date as written at the top of the page, dd/mm/yy. */
  dateLabel: string;
};

export type AnalyticsPeriod = "today" | "week" | "month";

export type SalesSummary = { revenue: number; orderCount: number; itemsSold: number };

export type TopItem = {
  menuItemId: number | null;
  name: string;
  quantity: number;
  revenue: number;
};

export type ConsumptionDriver = { menuItemId: number | null; name: string; consumed: number };

export type IngredientConsumption = {
  ingredientId: number;
  name: string;
  unit: string;
  consumed: number;
  drivers: ConsumptionDriver[];
};

export type AnalyticsResult = {
  period: AnalyticsPeriod;
  startDate: string;
  sales: SalesSummary;
  topItems: TopItem[];
  ingredients: IngredientConsumption[];
};
