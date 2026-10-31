import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, DollarSign, TrendingUp, Archive, AlertOctagon, Calendar, RefreshCw
} from "lucide-react";
import { getSalesReport, getInventoryReport, getWasteReport } from "../../api/reports";
import {
  StatCard, Card, CardHeader, CardBody, Table, Th, Td, Badge, Button,
  Select, LoadingState, ErrorState, EmptyState
} from "../../components/ui/index";
import { formatCurrency, formatDate, formatDateTime } from "../../utils/helpers";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("sales"); // 'sales' | 'inventory' | 'waste'
  const [dateRange, setDateRange] = useState("30"); // '7', '14', '30', '90'
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [wasteReport, setWasteReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const calculateDates = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const { startDate, endDate } = calculateDates(dateRange);

    try {
      if (activeTab === "sales") {
        const res = await getSalesReport({ startDate, endDate, groupBy: "day" });
        setSalesReport(res.data.data);
      } else if (activeTab === "inventory") {
        const res = await getInventoryReport();
        setInventoryReport(res.data.data);
      } else if (activeTab === "waste") {
        const res = await getWasteReport({ startDate, endDate });
        setWasteReport(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Aggregate calculations for summary cards
  const salesTotalRevenue = salesReport?.salesData?.reduce((s, d) => s + (d.revenue || 0), 0) || 0;
  const salesTotalCount = salesReport?.salesData?.reduce((s, d) => s + (d.count || 0), 0) || 0;
  const topProductsTotalProfit = salesReport?.topProducts?.reduce((s, p) => s + (p.profit || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Business Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Analyze sales performance, inventory capital valuation, and waste losses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab !== "inventory" && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: "7", label: "Last 7 Days" },
                  { value: "14", label: "Last 14 Days" },
                  { value: "30", label: "Last 30 Days" },
                  { value: "90", label: "Last 90 Days" },
                ]}
              />
            </div>
          )}
          <Button variant="secondary" onClick={fetchReports}>
            <RefreshCw size={15} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("sales")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "sales" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BarChart2 size={16} /> Sales & Profitability
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "inventory" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Archive size={16} /> Inventory Valuation
        </button>
        <button
          onClick={() => setActiveTab("waste")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "waste" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <AlertOctagon size={16} /> Waste & Loss Report
        </button>
      </div>

      {loading ? (
        <LoadingState message="Generating business report..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReports} />
      ) : (
        <>
          {/* TAB 1: SALES & PROFITABILITY */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Period Sales Revenue"
                  value={formatCurrency(salesTotalRevenue)}
                  icon={DollarSign}
                  color="green"
                  subtitle={`${salesTotalCount} total transactions`}
                />
                <StatCard
                  title="Average Ticket Size"
                  value={formatCurrency(salesTotalCount > 0 ? salesTotalRevenue / salesTotalCount : 0)}
                  icon={TrendingUp}
                  color="blue"
                  subtitle="Revenue per transaction"
                />
                <StatCard
                  title="Top Products Gross Profit"
                  value={formatCurrency(topProductsTotalProfit)}
                  icon={DollarSign}
                  color="yellow"
                  subtitle="Profit from top 10 ranked products"
                />
              </div>

              {/* Sales Chart */}
              <Card>
                <CardHeader
                  title="Daily Revenue Trend"
                  subtitle={`Revenue breakdown over the last ${dateRange} days`}
                />
                <CardBody>
                  {(!salesReport?.salesData || salesReport.salesData.length === 0) ? (
                    <EmptyState title="No sales data recorded" message="Sales recorded during this period will display here." />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={salesReport.salesData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value) => [formatCurrency(value), "Revenue"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="Daily Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>

              {/* Top Products Table */}
              <Card>
                <CardHeader
                  title="Top 10 Products by Revenue & Profitability"
                  subtitle="Calculates gross margin based on cost vs selling price."
                />
                {(!salesReport?.topProducts || salesReport.topProducts.length === 0) ? (
                  <CardBody>
                    <EmptyState title="No product sales found" message="No product-level transactions exist for the selected timeframe." />
                  </CardBody>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Product</Th>
                        <Th>Units Sold</Th>
                        <Th>Gross Revenue</Th>
                        <Th>Cost of Goods (COGS)</Th>
                        <Th>Gross Profit</Th>
                        <Th>Margin %</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.topProducts.map((p) => {
                        const margin = p.totalRevenue > 0 ? (p.profit / p.totalRevenue) * 100 : 0;
                        return (
                          <tr key={p._id}>
                            <Td className="font-medium text-gray-900">{p.name}</Td>
                            <Td className="font-semibold">{p.totalQty}</Td>
                            <Td>{formatCurrency(p.totalRevenue)}</Td>
                            <Td className="text-gray-500">{formatCurrency(p.totalCost)}</Td>
                            <Td className="font-semibold text-green-700">{formatCurrency(p.profit)}</Td>
                            <Td>
                              <Badge color={margin >= 25 ? "green" : margin >= 10 ? "yellow" : "red"}>
                                {margin.toFixed(1)}%
                              </Badge>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card>
            </div>
          )}

          {/* TAB 2: INVENTORY VALUATION */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  title="Total Capital Tied Up in Inventory"
                  value={formatCurrency(inventoryReport?.totalValue || 0)}
                  icon={DollarSign}
                  color="green"
                  subtitle="Current asset valuation at unit cost"
                />
                <StatCard
                  title="Active Tracked Products"
                  value={inventoryReport?.products?.length || 0}
                  icon={Archive}
                  color="blue"
                  subtitle="Catalog SKU count"
                />
              </div>

              <Card>
                <CardHeader
                  title="Stock Valuation by Product"
                  subtitle="Real-time evaluation based on available active batches and their specific intake purchase costs."
                />
                {(!inventoryReport?.products || inventoryReport.products.length === 0) ? (
                  <CardBody>
                    <EmptyState title="No inventory records" message="Products added to inventory will appear here." />
                  </CardBody>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Product</Th>
                        <Th>SKU</Th>
                        <Th>Category</Th>
                        <Th>Current Units</Th>
                        <Th>Reorder Point</Th>
                        <Th>Total Cost Valuation</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryReport.products.map((p, idx) => (
                        <tr key={idx}>
                          <Td className="font-medium text-gray-900">{p.product}</Td>
                          <Td className="font-mono text-xs text-gray-500">{p.sku}</Td>
                          <Td><Badge color="gray">{p.category}</Badge></Td>
                          <Td className="font-semibold">{p.currentStock}</Td>
                          <Td className="text-gray-500">{p.reorderLevel}</Td>
                          <Td className="font-bold text-gray-900">{formatCurrency(p.value)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: WASTE & LOSS REPORT */}
          {activeTab === "waste" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  title="Total Waste Financial Loss"
                  value={formatCurrency(wasteReport?.totalValue || 0)}
                  icon={AlertOctagon}
                  color="red"
                  subtitle={`Total cost lost to spoilage/waste in last ${dateRange} days`}
                />
                <StatCard
                  title="Waste Write-Off Events"
                  value={wasteReport?.movements?.length || 0}
                  icon={Archive}
                  color="yellow"
                  subtitle="Logged waste events"
                />
              </div>

              <Card>
                <CardHeader
                  title="Detailed Waste Audit Log"
                  subtitle="Historical records of discarded and expired batches."
                />
                {(!wasteReport?.movements || wasteReport.movements.length === 0) ? (
                  <CardBody>
                    <EmptyState
                      icon={AlertOctagon}
                      title="No waste logged in this period"
                      message="Great job! No stock was written off during the selected period."
                    />
                  </CardBody>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Date & Time</Th>
                        <Th>Product</Th>
                        <Th>Batch #</Th>
                        <Th>Units Lost</Th>
                        <Th>Unit Cost</Th>
                        <Th>Total Loss</Th>
                        <Th>Notes / Reason</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {wasteReport.movements.map((m) => {
                        const qty = Math.abs(m.quantity);
                        const unitCost = m.batch?.unitCost || m.product?.costPrice || 0;
                        const loss = qty * unitCost;
                        return (
                          <tr key={m._id}>
                            <Td className="text-xs text-gray-500">{formatDateTime(m.createdAt)}</Td>
                            <Td>
                              <p className="font-medium text-gray-900">{m.product?.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{m.product?.sku}</p>
                            </Td>
                            <Td className="font-mono text-xs">{m.batch?.batchNumber || "-"}</Td>
                            <Td className="font-bold text-red-600">-{qty}</Td>
                            <Td className="text-gray-600">{formatCurrency(unitCost)}</Td>
                            <Td className="font-bold text-red-700">{formatCurrency(loss)}</Td>
                            <Td className="text-xs text-gray-500 max-w-xs">{m.notes || "No notes entered"}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;