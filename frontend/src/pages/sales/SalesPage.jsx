import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search, ShoppingCart } from "lucide-react";
import { createSale, getSales } from "../../api/sales";
import { getProducts } from "../../api/products";
import { Card, CardHeader, CardBody, Table, Th, Td, Button, Badge, LoadingState, EmptyState, Modal, Input, Select, Pagination } from "../../components/ui/index";
import { formatCurrency, formatDateTime } from "../../utils/helpers";

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleError, setSaleError] = useState("");

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSales({ page, limit: 20 });
      setSales(res.data.data);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const searchProducts = useCallback(async () => {
    if (!productSearch.trim()) { setProducts([]); return; }
    try {
      const res = await getProducts({ search: productSearch, active: true, limit: 10 });
      setProducts(res.data.data);
    } catch {}
  }, [productSearch]);

  useEffect(() => {
    const t = setTimeout(searchProducts, 300);
    return () => clearTimeout(t);
  }, [searchProducts]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) return prev.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product._id, name: product.name, sku: product.sku, price: product.sellingPrice, quantity: 1 }];
    });
    setProductSearch("");
    setProducts([]);
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCartItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (productId) => setCartItems((prev) => prev.filter((i) => i.productId !== productId));

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - parseFloat(discount || 0));

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) return;
    setSaleError("");
    setSaleLoading(true);
    try {
      await createSale({ items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })), paymentMethod, discount: parseFloat(discount || 0) });
      setModal(false);
      setCartItems([]);
      setDiscount(0);
      fetchSales();
    } catch (err) {
      setSaleError(err.response?.data?.message || "Failed to complete sale");
    } finally {
      setSaleLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => { setModal(true); setCartItems([]); setSaleError(""); setDiscount(0); }}>
          <Plus size={16} /> New Sale
        </Button>
      </div>

      <Card>
        <CardHeader title="Recent Sales" />
        {loading ? <LoadingState /> : sales.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No sales yet" description="Start by creating your first sale." action={<Button onClick={() => setModal(true)}><Plus size={16} />New Sale</Button>} />
        ) : (
          <>
            <Table>
              <thead><tr><Th>Invoice #</Th><Th>Date & Time</Th><Th>Items</Th><Th>Payment</Th><Th>Total</Th></tr></thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <Td className="font-mono text-sm font-medium text-green-700">{s.saleNumber}</Td>
                    <Td className="text-gray-500 text-sm">{formatDateTime(s.saleDate)}</Td>
                    <Td className="text-gray-500">{s.items?.length} item{s.items?.length !== 1 ? "s" : ""}</Td>
                    <Td><Badge color="blue">{s.paymentMethod}</Badge></Td>
                    <Td className="font-semibold">{formatCurrency(s.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-4"><Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} /></div>
          </>
        )}
      </Card>

      {/* New Sale Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Sale" size="lg">
        <div className="space-y-4">
          {saleError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saleError}</div>}

          {/* Product search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product to add..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {products.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                {products.map((p) => (
                  <button key={p._id} onClick={() => addToCart(p)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between">
                    <span>{p.name} <span className="text-gray-400 text-xs">{p.sku}</span></span>
                    <span className="text-green-600 font-medium">{formatCurrency(p.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          {cartItems.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr><th className="px-3 py-2 text-left text-xs text-gray-500">Product</th><th className="px-3 py-2 text-center text-xs text-gray-500">Qty</th><th className="px-3 py-2 text-right text-xs text-gray-500">Price</th><th className="px-3 py-2 text-right text-xs text-gray-500">Subtotal</th><th className="px-3 py-2"></th></tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.productId} className="border-t border-gray-100">
                      <td className="px-3 py-2"><span className="font-medium">{item.name}</span><span className="text-gray-400 text-xs ml-1">{item.sku}</span></td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Trash2 size={10} /></button>
                          <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 0)} className="w-16 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                          <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg leading-none">+</button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">{formatCurrency(item.price)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 text-center text-gray-400 text-sm">
              Search and add products to start a sale
            </div>
          )}

          {/* Totals & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Discount (?)" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {parseFloat(discount) > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleCompleteSale} loading={saleLoading} disabled={cartItems.length === 0}>
              <ShoppingCart size={16} /> Complete Sale
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalesPage;
