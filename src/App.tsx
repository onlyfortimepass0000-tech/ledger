import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { OrdersPage } from "./pages/Orders";
import { InventoryPage } from "./pages/Inventory";
import { AnalyticsPage } from "./pages/Analytics";

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<OrdersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
