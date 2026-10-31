import { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Truck, Package } from "lucide-react";
import { getPurchaseOrders, createPurchaseOrder, updatePOStatus, receiveGoods } from "../../api/purchaseOrders";
import { getSuppliers } from "../../api/suppliers";
import { getProducts } from "../../api/products";
import { Card, Table, Th, Td, Button, Badge, LoadingState, EmptyState, Modal, Input, Select, Textarea, Pagination } from "../../components/ui/index";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { useAuth } from "../../contexts/AuthContext";

const statusColors = { draft: "gray", sent: "blue", partial: "yellow", received: "green", cancelled: "red" };

const PurchaseOrdersPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole("owner", "manager");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, order: null });
  const [receiveModal, setReceiveModal] = useState({ open: false, order: null });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ supplierId: "", expectedDate: "", notes: "", items: [{ productId: "", quantity: "", unitCost: "" }] });
  const [receiptData, setReceiptData] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPurchaseOrders({ page, limit: 20, status: statusFilter });
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    getSuppliers({ limit: 100 }).then((r) => setSuppliers(r.data.data)).catch(() => {});
    getProducts({ limit: 200, active: true }).then((r) => setProducts(r.data.data)).catch(() => {});
  }, []);

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantity: "", unitCost: "" }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm((f) => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const items = form.items.map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity), unitCost: parseFloat(i.unitCost) }));
      await createPurchaseOrder({ supplierId: form.supplierId, items, expectedDate: form.expectedDate, notes: form.notes });
      setCreateModal(false);
      setForm({ supplierId: "", expectedDate: "", notes: "", items: [{ productId: "", quantity: "", unitCost: "" }] });
      fetchOrders();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create order");
    } finally { setFormLoading(false); }
  };

  const openReceive = (order) => {
    setReceiveModal({ open: true, order });
    setReceiptData(order.items.map((item, idx) => ({
      itemIndex: idx,
      receivedQty: Math.max(0, item.orderedQty - item.receivedQty),
      expiryDate: "",
      batchNumber: "",
    })));
  };

  const handleReceive = async () => {
    setFormLoading(true);
    setFormError("");
    try {
      const receipts = receiptData.filter((r) => r.receivedQty > 0);
      await receiveGoods(receiveModal.order._id, { receipts });
      setReceiveModal({ open: false, order: null });
      fetchOrders();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to receive goods");
    } finally { setFormLoading(false); }
  };

  const handleStatusUpdate = async (order, status) => {
    try { await updatePOStatus(order._id, { status }); fetchOrders(); } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["", "draft", "sent", "partial", "received", "cancelled"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${statusFilter === s ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {canEdit && <Button onClick={() => setCreateModal(true)}><Plus size={16} /> Create Order</Button>}
      </div>

      <Card>
        {loading ? <LoadingState /> : orders.length === 0 ? (
          <EmptyState icon={Package} title="No purchase orders" description="Create your first purchase order." action={canEdit ? <Button onClick={() => setCreateModal(true)}><Plus size={16} />Create Order</Button> : null} />
        ) : (
          <>
            <Table>
              <thead><tr><Th>PO Number</Th><Th>Supplier</Th><Th>Date</Th><Th>Expected</Th><Th>Items</Th><Th>Total</Th><Th>Status</Th>{canEdit && <Th>Actions</Th>}</tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <Td className="font-mono text-sm font-medium text-green-700">{o.poNumber}</Td>
                    <Td className="font-medium">{o.supplier?.name}</Td>
                    <Td className="text-gray-500 text-sm">{formatDate(o.orderDate)}</Td>
                    <Td className="text-gray-500 text-sm">{o.expectedDate ? formatDate(o.expectedDate) : "-"}</Td>
                    <Td className="text-gray-500">{o.items?.length}</Td>
                    <Td className="font-medium">{formatCurrency(o.totalAmount)}</Td>
                    <Td><Badge color={statusColors[o.status]}>{o.status}</Badge></Td>
                    {canEdit && (
                      <Td>
                        <div className="flex gap-1">
                          <button onClick={() => setViewModal({ open: true, order: o })} className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100">View</button>
                          {(o.status === "draft" || o.status === "sent") && (
                            <button onClick={() => handleStatusUpdate(o, o.status === "draft" ? "sent" : "draft")} className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                              {o.status === "draft" ? "Mark Sent" : "Back to Draft"}
                            </button>
                          )}
                          {(o.status === "sent" || o.status === "partial") && (
                            <button onClick={() => openReceive(o)} className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded hover:bg-green-100">
                              Receive
                            </button>
                          )}
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-4"><Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} /></div>
          </>
        )}
      </Card>

      {/* Create PO Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Purchase Order" size="xl">
        {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Supplier *" value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} required>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
            <Input label="Expected Delivery Date" type="date" value={form.expectedDate} onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Order Items</h4>
              <button type="button" onClick={addItem} className="text-sm text-green-600 hover:text-green-700 font-medium">+ Add Item</button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <select value={item.productId} onChange={(e) => {
                      const p = products.find((p) => p._id === e.target.value);
                      updateItem(idx, "productId", e.target.value);
                      if (p) updateItem(idx, "unitCost", p.costPrice);
                    }} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required>
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} placeholder="Qty" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min="0" step="0.01" value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", e.target.value)} placeholder="Unit cost" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
                  </div>
                  <div className="col-span-1">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="w-full py-2 text-red-400 hover:text-red-600 text-lg">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Create Purchase Order</Button>
          </div>
        </form>
      </Modal>

      {/* Receive Goods Modal */}
      <Modal isOpen={receiveModal.open} onClose={() => setReceiveModal({ open: false, order: null })} title="Receive Goods" size="lg">
        {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
        {receiveModal.order && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">PO: <strong>{receiveModal.order.poNumber}</strong> · Supplier: <strong>{receiveModal.order.supplier?.name}</strong></p>
            <div className="space-y-3">
              {receiveModal.order.items?.map((item, idx) => {
                const remaining = item.orderedQty - item.receivedQty;
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">{item.productName} <span className="text-gray-400 text-xs">Ordered: {item.orderedQty} | Received: {item.receivedQty} | Remaining: {remaining}</span></p>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="Receive Qty" type="number" min="0" max={remaining} value={receiptData[idx]?.receivedQty || 0} onChange={(e) => {
                        const d = [...receiptData];
                        d[idx] = { ...d[idx], receivedQty: parseInt(e.target.value) || 0 };
                        setReceiptData(d);
                      }} />
                      <Input label="Expiry Date" type="date" value={receiptData[idx]?.expiryDate || ""} onChange={(e) => {
                        const d = [...receiptData];
                        d[idx] = { ...d[idx], expiryDate: e.target.value };
                        setReceiptData(d);
                      }} />
                      <Input label="Batch # (optional)" value={receiptData[idx]?.batchNumber || ""} onChange={(e) => {
                        const d = [...receiptData];
                        d[idx] = { ...d[idx], batchNumber: e.target.value };
                        setReceiptData(d);
                      }} placeholder="Auto-generated" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setReceiveModal({ open: false, order: null })}>Cancel</Button>
              <Button onClick={handleReceive} loading={formLoading}><Truck size={16} /> Confirm Receipt</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;
