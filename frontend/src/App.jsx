import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Main Application Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import SalesPage from "./pages/sales/SalesPage";
import SuppliersPage from "./pages/suppliers/SuppliersPage";
import PurchaseOrdersPage from "./pages/purchaseOrders/PurchaseOrdersPage";
import ForecastPage from "./pages/forecast/ForecastPage";
import ExpiryPage from "./pages/expiry/ExpiryPage";
import ReportsPage from "./pages/reports/ReportsPage";
import SettingsPage from "./pages/settings/SettingsPage";

// Loading component while checking auth session
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Loading StockWise...</p>
    </div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Application Routes inside Layout Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route
              path="suppliers"
              element={
                <ProtectedRoute allowedRoles={["owner", "manager"]}>
                  <SuppliersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="purchase-orders"
              element={
                <ProtectedRoute allowedRoles={["owner", "manager"]}>
                  <PurchaseOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="forecast"
              element={
                <ProtectedRoute allowedRoles={["owner", "manager"]}>
                  <ForecastPage />
                </ProtectedRoute>
              }
            />
            <Route path="expiry" element={<ExpiryPage />} />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={["owner", "manager"]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;