import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, AlertOctagon, Trash2, RefreshCw } from "lucide-react";
import { getExpiryAlerts } from "../../api/expiry";
import { recordWaste } from "../../api/inventory";
import {
  StatCard, Card, CardHeader, CardBody, Table, Th, Td, Badge, Button,
  Modal, Input, Textarea, LoadingState, ErrorState, EmptyState
} from "../../components/ui/index";
import { formatCurrency, formatDate, getExpiryColor } from "../../utils/helpers";
import { useAuth } from "../../contexts/AuthContext";

const ExpiryPage = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("owner", "manager");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all"); // 'all' | 'expired' | '7days' | '30days'

  // Waste modal state
  const [wasteModal, setWasteModal] = useState({ open: false, batch: null });
  const [wasteQty, setWasteQty] = useState("");
  const [wasteNotes, setWasteNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getExpiryAlerts();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load expiry alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleOpenWaste = (batch) => {
    setWasteModal({ open: true, batch });
    setWasteQty(batch.remainingQuantity.toString());
    setWasteNotes("Expired or spoiled inventory write-off");
    setActionError("");
  };

  const handleConfirmWaste = async (e) => {
    e.preventDefault();
    if (!wasteModal.batch) return;
    const qty = parseFloat(wasteQty);
    if (!qty || qty <= 0 || qty > wasteModal.batch.remainingQuantity) {
      setActionError(`Quantity must be between 1 and ${wasteModal.batch.remainingQuantity}`);
      return;
    }

    setSubmitting(true);
    setActionError("");
    try {
      await recordWaste({
        batchId: wasteModal.batch._id,
        quantity: qty,
        notes: wasteNotes,
      });
      setWasteModal({ open: false, batch: null });
      fetchAlerts();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to record waste");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) return <LoadingState message="Analyzing batch expiry data..." />;
  if (error && !data) return <ErrorState message={error} onRetry={fetchAlerts} />;

  const summary = data?.summary || { expiredCount: 0, expiring7Count: 0, expiring30Count: 0, totalRiskValue: 0 };
  const expiredList = data?.expired || [];
  const exp7List = data?.expiring7Days || [];
  const exp30List = data?.expiring30Days || [];

  const getFilteredBatches = () => {
    if (tab === "expired") return expiredList;
    if (tab === "7days") return exp7List;
    if (tab === "30days") return exp30List;
    return [...expiredList, ...exp7List, ...exp30List];
  };

  const currentBatches = getFilteredBatches();

  const getSuggestionBadge = (suggestion) => {
    switch (suggestion) {
      case "Record Wastage":
        return <Badge color="red">Record Wastage</Badge>;
      case "Consider Discount":
        return <Badge color="orange">Consider Discount</Badge>;
      case "Prioritize Selling":
        return <Badge color="yellow">Prioritize Selling</Badge>;
      default:
        return <Badge color="green">Normal Sales</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expiry Management & Risk Monitoring</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track batches nearing expiry, assess financial risk, and take early action using sales forecasts.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchAlerts} className="self-start sm:self-auto">
          <RefreshCw size={15} /> Refresh Alerts
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Risk Value"
          value={formatCurrency(summary.totalRiskValue)}
          icon={AlertTriangle}
          color="red"
          subtitle="Cost value of expiring/expired stock"
        />
        <StatCard
          title="Already Expired"
          value={summary.expiredCount}
          icon={AlertOctagon}
          color="red"
          subtitle="Requires immediate disposal/write-off"
        />
        <StatCard
          title="Expiring in ≤ 7 Days"
          value={summary.expiring7Count}
          icon={Clock}
          color="orange"
          subtitle="Urgent action needed"
        />
        <StatCard
          title="Expiring in ≤ 30 Days"
          value={summary.expiring30Count}
          icon={AlertTriangle}
          color="yellow"
          subtitle="Monitor and prioritize in FEFO"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "all" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All At-Risk ({expiredList.length + exp7List.length + exp30List.length})
        </button>
        <button
          onClick={() => setTab("expired")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "expired" ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Expired ({expiredList.length})
        </button>
        <button
          onClick={() => setTab("7days")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "7days" ? "border-orange-600 text-orange-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Expiring in 7 Days ({exp7List.length})
        </button>
        <button
          onClick={() => setTab("30days")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "30days" ? "border-yellow-600 text-yellow-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Expiring in 30 Days ({exp30List.length})
        </button>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader
          title={
            tab === "expired" ? "Expired Batches (Action Required)"
            : tab === "7days" ? "Batches Expiring Within 7 Days"
            : tab === "30days" ? "Batches Expiring Within 30 Days"
            : "All Batches At Risk"
          }
          subtitle="Automated recommendations compare current stock against predicted sales until expiration."
        />
        {currentBatches.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={Clock}
              title="No batches found in this category"
              message="All inventory batches are either well within freshness limits or have already been resolved."
            />
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Batch #</Th>
                <Th>Product</Th>
                <Th>Remaining Qty</Th>
                <Th>Expiry Date</Th>
                <Th>Days Left</Th>
                <Th>Forecast Demand</Th>
                <Th>Risk Value</Th>
                <Th>Smart Recommendation</Th>
                {canManage && <Th>Action</Th>}
              </tr>
            </thead>
            <tbody>
              {currentBatches.map((batch) => {
                const daysLeft = batch.daysLeft;
                const isExpired = daysLeft !== null && daysLeft <= 0;
                return (
                  <tr key={batch._id} className={isExpired ? "bg-red-50/40" : undefined}>
                    <Td className="font-mono text-xs font-semibold text-gray-700">
                      {batch.batchNumber}
                    </Td>
                    <Td>
                      <p className="font-medium text-gray-900">{batch.product?.name || "Unknown Product"}</p>
                      <p className="text-xs text-gray-400 font-mono">{batch.product?.sku}</p>
                    </Td>
                    <Td className="font-semibold text-gray-800">
                      {batch.remainingQuantity}
                    </Td>
                    <Td className="text-gray-600 text-sm">
                      {formatDate(batch.expiryDate)}
                    </Td>
                    <Td>
                      <span className={`font-semibold text-xs ${getExpiryColor(daysLeft)}`}>
                        {isExpired ? "EXPIRED" : `${daysLeft} days`}
                      </span>
                    </Td>
                    <Td className="text-gray-700 text-sm">
                      {batch.forecastedSales > 0 ? `${batch.forecastedSales} units` : "0 (No demand)"}
                    </Td>
                    <Td className="font-medium text-gray-900">
                      {formatCurrency(batch.riskValue)}
                    </Td>
                    <Td>
                      {getSuggestionBadge(batch.suggestion)}
                    </Td>
                    {canManage && (
                      <Td>
                        {isExpired || batch.suggestion === "Record Wastage" ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleOpenWaste(batch)}
                          >
                            <Trash2 size={13} /> Write Off
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">FEFO active</span>
                        )}
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Record Waste Modal */}
      <Modal
        open={wasteModal.open}
        onClose={() => setWasteModal({ open: false, batch: null })}
        title="Record Inventory Waste / Write-Off"
      >
        <form onSubmit={handleConfirmWaste} className="space-y-4">
          <p className="text-sm text-gray-600">
            Writing off stock will immediately deduct the units from this batch and log an auditable <strong>waste</strong> stock movement.
          </p>
          {wasteModal.batch && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm space-y-1">
              <p><strong>Product:</strong> {wasteModal.batch.product?.name}</p>
              <p><strong>Batch:</strong> <span className="font-mono">{wasteModal.batch.batchNumber}</span></p>
              <p><strong>Available to write off:</strong> {wasteModal.batch.remainingQuantity} units</p>
            </div>
          )}

          <Input
            label="Waste Quantity"
            type="number"
            min="1"
            max={wasteModal.batch?.remainingQuantity}
            value={wasteQty}
            onChange={(e) => setWasteQty(e.target.value)}
            required
          />

          <Textarea
            label="Reason / Notes"
            value={wasteNotes}
            onChange={(e) => setWasteNotes(e.target.value)}
            rows={2}
          />

          {actionError && <p className="text-sm text-red-600">{actionError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setWasteModal({ open: false, batch: null })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={submitting}>
              Confirm Waste
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpiryPage;