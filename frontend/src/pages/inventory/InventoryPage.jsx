import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";
import { getInventory, getProductBatches, getStockMovements, adjustStock, recordWaste } from "../../api/inventory";
import { Card, Table, Th, Td, Button, Badge, LoadingState, ErrorState, EmptyState, Modal, Input, Textarea, Pagination } from "../../components/ui/index";
import { formatCurrency, formatDate, getStockStatusColor, getStockStatusLabel, getExpiryColor, daysFromNow } from "../../utils/helpers";
import { useAuth } from "../../contexts/AuthContext";
import { Archive } from "lucide-react";

const InventoryPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole("owner", "manager");

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [expanded, setExpanded] = useState({});
  const [batches, setBatches] = useState({});
  const [modal, setModal] = useState({ open: false, type: "", batch: null, product: null });
  const [form, setForm] = useState({ quantity: "", notes: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventory({ search, lowStock: lowStockOnly, page, limit: 20 });
      setInventory(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [search, lowStockOnly, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const toggleExpand = async (productId) => {
    const isOpen = expanded[productId];
    setExpanded((prev) => ({ ...prev, [productId]: !isOpen }));
    if (!isOpen && !batches[productId]) {
      try {
        const res = await getProductBatches(productId);
        setBatches((prev) => ({ ...prev, [productId]: res.data.data }));
      } catch {}
    }
  };

  const openAdjustModal = (type, batch, product) => {
    setFormError("");
    setForm({ quantity: "", notes: "" });
    setModal({ open: true, type, batch, product });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const qty = parseFloat(form.quantity);
      if (modal.type === "adjust") {
        await adjustStock({ batchId: modal.batch._id, quantity: qty, notes: form.notes });
      } else {
        if (qty <= 0) throw new Error("Waste quantity must be positive");
        await recordWaste({ batchId: modal.batch._id, quantity: qty, notes: form.notes });
      }
      setModal({ open: false, type: "", batch: null, product: null });
      // Refresh batches
      const res = await getProductBatches(modal.batch.product);
      setBatches((prev) => ({ ...prev, [modal.batch.product]: res.data.data }));
      fetchInventory();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={fetchInventory} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64" />
          </div>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} className="accent-green-600" />
            Low stock only
          </label>
        </div>
      </div>

      <Card>
        {loading ? <LoadingState /> : inventory.length === 0 ? (
          <EmptyState icon={Archive} title="No inventory found" description="Add products and receive stock to see inventory." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th></Th>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th>Current Stock</Th>
                  <Th>Status</Th>
                  <Th>Inventory Value</Th>
                  <Th>Batches</Th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <>
                    <tr key={item.product._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(item.product._id)}>
                      <Td className="w-8">
                        {expanded[item.product._id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                      </Td>
                      <Td className="font-medium">{item.product.name}</Td>
                      <Td className="text-gray-500 font-mono text-xs">{item.product.sku}</Td>
                      <Td><Badge color="blue">{item.product.category}</Badge></Td>
                      <Td>
                        <span className={`font-bold ${item.isCritical ? "text-red-600" : item.isLowStock ? "text-yellow-600" : "text-gray-900"}`}>
                          {item.currentStock} {item.product.unit}
                        </span>
                      </Td>
                      <Td>
                        <Badge color={item.isCritical ? "red" : item.isLowStock ? "yellow" : "green"}>
                          {item.isCritical ? "Critical" : item.isLowStock ? "Low Stock" : "Normal"}
                        </Badge>
                      </Td>
                      <Td>{formatCurrency(item.inventoryValue)}</Td>
                      <Td className="text-gray-500">{item.activeBatches} active</Td>
                    </tr>
                    {expanded[item.product._id] && (
                      <tr key={`${item.product._id}-expanded`}>
                        <td colSpan={8} className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                          {!batches[item.product._id] ? (
                            <p className="text-sm text-gray-500">Loading batches...</p>
                          ) : batches[item.product._id].length === 0 ? (
                            <p className="text-sm text-gray-500">No active batches</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500">
                                    <th className="px-3 py-1 text-left">Batch #</th>
                                    <th className="px-3 py-1 text-left">Received</th>
                                    <th className="px-3 py-1 text-left">Expiry</th>
                                    <th className="px-3 py-1 text-left">Qty</th>
                                    <th className="px-3 py-1 text-left">Unit Cost</th>
                                    <th className="px-3 py-1 text-left">Status</th>
                                    {canEdit && <th className="px-3 py-1 text-left">Actions</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {batches[item.product._id].map((b) => {
                                    const days = daysFromNow(b.expiryDate);
                                    return (
                                      <tr key={b._id} className="border-t border-gray-100">
                                        <td className="px-3 py-2 font-mono">{b.batchNumber}</td>
                                        <td className="px-3 py-2 text-gray-500">{formatDate(b.receivedDate)}</td>
                                        <td className="px-3 py-2">
                                          {b.expiryDate ? (
                                            <span className={getExpiryColor(days)}>
                                              {formatDate(b.expiryDate)}{days !== null ? ` (${days}d)` : ""}
                                            </span>
                                          ) : <span className="text-gray-400">No expiry</span>}
                                        </td>
                                        <td className="px-3 py-2 font-medium">{b.remainingQuantity} / {b.initialQuantity}</td>
                                        <td className="px-3 py-2 text-gray-500">{formatCurrency(b.unitCost)}</td>
                                        <td className="px-3 py-2">
                                          <Badge color={b.status === "active" ? "green" : b.status === "exhausted" ? "gray" : "red"}>{b.status}</Badge>
                                        </td>
                                        {canEdit && (
                                          <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                              <button onClick={() => openAdjustModal("adjust", b, item.product)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                                Adjust
                                              </button>
                                              <button onClick={() => openAdjustModal("waste", b, item.product)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">
                                                Waste
                                              </button>
                                            </div>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-4">
              <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, type: "", batch: null, product: null })}
        title={modal.type === "adjust" ? "Adjust Stock" : "Record Waste"} size="sm">
        {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
        {modal.batch && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">{modal.product?.name}</p>
            <p className="text-gray-500 text-xs">Batch: {modal.batch.batchNumber} | Current: {modal.batch.remainingQuantity} {modal.product?.unit}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={modal.type === "adjust" ? "Quantity to Add/Remove (use negative to remove)" : "Quantity to Waste"}
            name="quantity"
            type="number"
            step="0.01"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            required
            placeholder={modal.type === "adjust" ? "+10 or -5" : "5"}
          />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Reason for adjustment..." />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, type: "", batch: null, product: null })}>Cancel</Button>
            <Button type="submit" variant={modal.type === "waste" ? "danger" : "primary"} loading={formLoading}>
              {modal.type === "adjust" ? "Apply Adjustment" : "Record Waste"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
