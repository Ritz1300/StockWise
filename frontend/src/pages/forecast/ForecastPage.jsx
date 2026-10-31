import { useState, useEffect, useCallback } from "react";
import { TrendingUp, RefreshCw, Info } from "lucide-react";
import { getForecast, getReorderRecommendations } from "../../api/forecast";
import { getProducts } from "../../api/products";
import { createPurchaseOrder } from "../../api/purchaseOrders";
import { getSuppliers } from "../../api/suppliers";
import { Card, CardHeader, CardBody, Table, Th, Td, Button, Badge, LoadingState, EmptyState } from "../../components/ui/index";
import { formatCurrency } from "../../utils/helpers";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const riskColors = { high: "red", medium: "yellow", low: "green" };
const confidenceColors = { high: "green", medium: "yellow", low: "red" };

const ForecastPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [period, setPeriod] = useState(7);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("forecast");

  const fetchRecommendations = useCallback(async () => {
    setRecoLoading(true);
    try {
      const res = await getReorderRecommendations();
      setRecommendations(res.data.data);
    } catch {} finally { setRecoLoading(false); }
  }, []);

  useEffect(() => {
    getProducts({ active: true, limit: 200 }).then((r) => setProducts(r.data.data)).catch(() => {});
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleForecast = async () => {
    if (!selectedProduct) return;
    setForecastLoading(true);
    setForecastError("");
    setForecast(null);
    try {
      const res = await getForecast({ productId: selectedProduct, period });
      setForecast(res.data.data);
    } catch (err) {
      setForecastError(err.response?.data?.message || "Failed to generate forecast");
    } finally { setForecastLoading(false); }
  };

  const chartData = forecast ? [
    ...forecast.history.map((h) => ({ date: h.date.slice(5), actual: h.quantity, type: "historical" })),
    ...forecast.predictions.map((p) => ({ date: p.date.slice(5), predicted: p.quantity, type: "forecast" })),
  ] : [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[{ id: "forecast", label: "Product Forecast" }, { id: "reorder", label: "Reorder Recommendations" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "forecast" && (
        <div className="space-y-5">
          {/* Controls */}
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select a product...</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Period</label>
                  <select value={period} onChange={(e) => setPeriod(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={28}>28 days</option>
                  </select>
                </div>
                <Button onClick={handleForecast} loading={forecastLoading} disabled={!selectedProduct}>
                  <RefreshCw size={16} /> Generate Forecast
                </Button>
              </div>
            </CardBody>
          </Card>

          {forecastError && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{forecastError}</div>}

          {forecastLoading && <LoadingState />}

          {forecast && !forecastLoading && (
            <div className="space-y-5">
              {/* Product + model info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Forecast</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(forecast.totalForecast)}</p>
                  <p className="text-xs text-gray-400">units over {period} days</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Daily Average</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{(forecast.totalForecast / period).toFixed(1)}</p>
                  <p className="text-xs text-gray-400">units per day</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Model Used</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{forecast.model?.replace(/_/g, " ")}</p>
                  <Badge color={confidenceColors[forecast.confidence]} className="mt-1">{forecast.confidence} confidence</Badge>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Accuracy (WAPE)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {forecast.metrics?.wape != null ? `${(100 - forecast.metrics.wape).toFixed(0)}%` : "N/A"}
                  </p>
                  <p className="text-xs text-gray-400">MAE: {forecast.metrics?.mae ?? "N/A"}</p>
                </Card>
              </div>

              {/* Explanation */}
              {forecast.explanation && (
                <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">{forecast.explanation}</p>
                </div>
              )}

              {/* Chart */}
              <Card>
                <CardHeader title="Historical Sales & Forecast" subtitle="Last 30 days actual + next forecast period" />
                <CardBody>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#16a34a" strokeWidth={2} name="Actual Sales" dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="predicted" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" name="Forecast" dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Prediction table */}
              <Card>
                <CardHeader title="Daily Predictions" />
                <Table>
                  <thead><tr><Th>Date</Th><Th>Forecasted Units</Th></tr></thead>
                  <tbody>
                    {forecast.predictions.map((p) => (
                      <tr key={p.date} className="hover:bg-gray-50">
                        <Td>{p.date}</Td>
                        <Td className="font-medium">{p.quantity}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </div>
          )}

          {!forecast && !forecastLoading && !forecastError && (
            <EmptyState icon={TrendingUp} title="Select a product to view forecast" description="Choose a product and period, then click Generate Forecast." />
          )}
        </div>
      )}

      {activeTab === "reorder" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Smart Reorder Recommendations</h3>
              <p className="text-sm text-gray-500">Based on forecasted demand, current stock, and lead times</p>
            </div>
            <Button variant="secondary" onClick={fetchRecommendations} loading={recoLoading}><RefreshCw size={16} /> Refresh</Button>
          </div>

          {recoLoading ? <LoadingState /> : !recommendations ? null : (
            <div className="space-y-4">
              {recommendations.summary && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{recommendations.summary.total}</p><p className="text-sm text-gray-500">Products Analyzed</p></Card>
                  <Card className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{recommendations.summary.urgent}</p><p className="text-sm text-gray-500">Urgent Reorder</p></Card>
                  <Card className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{recommendations.summary.needsAction}</p><p className="text-sm text-gray-500">Needs Reorder</p></Card>
                </div>
              )}

              <Card>
                <Table>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Current Stock</Th>
                      <Th>Days of Stock</Th>
                      <Th>Forecast (28d)</Th>
                      <Th>Suggested Order</Th>
                      <Th>Risk</Th>
                      <Th>Action</Th>
                      <Th>Reason</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.recommendations?.filter((r) => r.needsReorder).map((r) => (
                      <tr key={r.product._id} className="hover:bg-gray-50">
                        <Td>
                          <p className="font-medium">{r.product.name}</p>
                          <p className="text-xs text-gray-400">{r.product.sku}</p>
                        </Td>
                        <Td className="font-medium">{r.currentStock}</Td>
                        <Td className={`font-medium ${r.daysOfStock < 3 ? "text-red-600" : r.daysOfStock < 7 ? "text-yellow-600" : "text-gray-700"}`}>
                          {r.daysOfStock === 999 ? "8" : `${r.daysOfStock}d`}
                        </Td>
                        <Td>{r.forecastDemand28Days}</Td>
                        <Td className="font-bold text-green-700">{r.suggestedOrderQty}</Td>
                        <Td><Badge color={riskColors[r.stockoutRisk]}>{r.stockoutRisk}</Badge></Td>
                        <Td><Badge color={r.stockoutRisk === "high" ? "red" : "yellow"}>{r.action}</Badge></Td>
                        <Td className="text-xs text-gray-500 max-w-xs">{r.reason}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {recommendations.recommendations?.filter((r) => r.needsReorder).length === 0 && (
                  <CardBody><p className="text-sm text-gray-500 text-center py-4">All products are well stocked. No reorder needed.</p></CardBody>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ForecastPage;

