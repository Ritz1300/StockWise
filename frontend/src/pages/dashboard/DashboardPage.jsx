import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, DollarSign, AlertTriangle, ShoppingCart, Clock, ClipboardList
} from "lucide-react";
import { getDashboardStats } from "../../api/dashboard";
import { StatCard, Card, CardHeader, CardBody, Table, Th, Td, Badge, LoadingState, ErrorState } from "../../components/ui/index";
import { formatCurrency, formatDate, getExpiryColor, daysFromNow } from "../../utils/helpers";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from "recharts";

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardStats()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const { summary, dailySales, topProducts, lowStockProducts, nearExpiry } = data;

  const salesChartData = dailySales.map((d) => ({ date: d._id?.slice(5), revenue: parseFloat((d.total || 0).toFixed(2)) }));
  const topProductsData = topProducts.map((p) => ({ name: p.name?.slice(0, 15), qty: p.totalQty }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-1">
        <StatCard title="Total Products" value={summary.totalProducts} icon={Package} color="blue" />
        <StatCard title="Inventory Value" value={formatCurrency(summary.totalInventoryValue)} color="green" subtitle="Cost value" />
        <StatCard title="Today's Sales" value={formatCurrency(summary.todaySales)} color="green" subtitle={`${summary.todaySalesCount} transactions`} />
        <StatCard title="Low Stock" value={summary.lowStockCount} icon={AlertTriangle} color={summary.lowStockCount > 0 ? "red" : "green"} subtitle="Products at/below reorder" />
        <StatCard title="Near Expiry" value={summary.nearExpiryCount} icon={Clock} color={summary.nearExpiryCount > 0 ? "yellow" : "green"} subtitle="Within 30 days" />
        <StatCard title="Pending Orders" value={summary.pendingPOs} icon={ClipboardList} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Sales (Last 14 Days)" />
          <CardBody>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `?${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => `Date: ${l}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No sales data yet</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top Products (30 Days)" subtitle="By quantity sold" />
          <CardBody>
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No sales data yet</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Low stock and Near expiry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Low Stock Products" actions={
            <button onClick={() => navigate("/inventory?lowStock=true")} className="text-sm text-green-600 hover:text-green-700 font-medium">View all</button>
          } />
          {lowStockProducts.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Stock</Th>
                  <Th>Reorder At</Th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/inventory?product=${p._id}`)}>
                    <Td className="font-medium">{p.name}</Td>
                    <Td className="text-gray-500">{p.sku}</Td>
                    <Td><span className="font-bold text-red-600">{p.currentStock}</span></Td>
                    <Td className="text-gray-500">{p.reorderLevel}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <CardBody><p className="text-sm text-gray-500 text-center py-4">All products are sufficiently stocked</p></CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="Expiring Soon" subtitle="Next 7 days" actions={
            <button onClick={() => navigate("/expiry")} className="text-sm text-green-600 hover:text-green-700 font-medium">View all</button>
          } />
          {nearExpiry.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Batch</Th>
                  <Th>Qty</Th>
                  <Th>Expires</Th>
                </tr>
              </thead>
              <tbody>
                {nearExpiry.map((b) => {
                  const days = daysFromNow(b.expiryDate);
                  return (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <Td className="font-medium">{b.product?.name}</Td>
                      <Td className="text-gray-500 text-xs">{b.batchNumber}</Td>
                      <Td>{b.remainingQuantity}</Td>
                      <Td><span className={`font-medium ${getExpiryColor(days)}`}>{days !== null ? `${days}d` : "-"}</span></Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <CardBody><p className="text-sm text-gray-500 text-center py-4">No items expiring in the next 7 days</p></CardBody>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
