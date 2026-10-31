import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, PowerOff, Eye } from "lucide-react";
import { getProducts, createProduct, updateProduct, deactivateProduct, getCategories } from "../../api/products";
import { getSuppliers } from "../../api/suppliers";
import { Card, Table, Th, Td, Button, Badge, LoadingState, ErrorState, EmptyState, Modal, Input, Select, Textarea, Pagination } from "../../components/ui/index";
import { formatCurrency } from "../../utils/helpers";
import { useAuth } from "../../contexts/AuthContext";
import { Package } from "lucide-react";

const UNITS = ["pcs", "kg", "g", "litre", "ml", "dozen", "pack", "box", "bag", "bottle", "crate"];

const emptyForm = { name: "", sku: "", barcode: "", category: "", unit: "pcs", costPrice: "", sellingPrice: "", reorderLevel: "10", safetyStock: "5", targetCoverageDays: "14", supplier: "", description: "" };

const ProductsPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole("owner", "manager");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState({ open: false, type: "", product: null });
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({ search, category: categoryFilter, active: showActive, page, limit: 20 });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, showActive, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data)).catch(() => {});
    getSuppliers({ limit: 100 }).then((r) => setSuppliers(r.data.data)).catch(() => {});
  }, []);

  const openModal = (type, product = null) => {
    setFormError("");
    setModal({ open: true, type, product });
    setForm(product ? {
      name: product.name, sku: product.sku, barcode: product.barcode || "", category: product.category,
      unit: product.unit, costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel, safetyStock: product.safetyStock,
      targetCoverageDays: product.targetCoverageDays, supplier: product.supplier?._id || "",
      description: product.description || "",
    } : emptyForm);
  };

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const payload = { ...form, costPrice: parseFloat(form.costPrice), sellingPrice: parseFloat(form.sellingPrice), reorderLevel: parseInt(form.reorderLevel), safetyStock: parseInt(form.safetyStock), targetCoverageDays: parseInt(form.targetCoverageDays) };
      if (modal.type === "create") await createProduct(payload);
      else await updateProduct(modal.product._id, payload);
      setModal({ open: false, type: "", product: null });
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this product?")) return;
    try { await deactivateProduct(id); fetchProducts(); } catch {}
  };

  if (error) return <ErrorState message={error} onRetry={fetchProducts} />;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={showActive} onChange={(e) => { setShowActive(e.target.value === "true"); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        {canEdit && (
          <Button onClick={() => openModal("create")} className="shrink-0">
            <Plus size={16} /> Add Product
          </Button>
        )}
      </div>

      <Card>
        {loading ? <LoadingState /> : products.length === 0 ? (
          <EmptyState icon={Package} title="No products found" description="Add your first product to get started." action={canEdit ? <Button onClick={() => openModal("create")}><Plus size={16} />Add Product</Button> : null} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th>Unit</Th>
                  <Th>Cost Price</Th>
                  <Th>Selling Price</Th>
                  <Th>Reorder At</Th>
                  <Th>Status</Th>
                  {canEdit && <Th>Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <Td>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.supplier?.name && <p className="text-xs text-gray-400">{p.supplier.name}</p>}
                      </div>
                    </Td>
                    <Td className="text-gray-500 font-mono text-xs">{p.sku}</Td>
                    <Td><Badge color="blue">{p.category}</Badge></Td>
                    <Td className="text-gray-500">{p.unit}</Td>
                    <Td>{formatCurrency(p.costPrice)}</Td>
                    <Td className="font-medium">{formatCurrency(p.sellingPrice)}</Td>
                    <Td className="text-gray-500">{p.reorderLevel}</Td>
                    <Td><Badge color={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Inactive"}</Badge></Td>
                    {canEdit && (
                      <Td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openModal("edit", p)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Edit">
                            <Edit2 size={15} />
                          </button>
                          {p.isActive && (
                            <button onClick={() => handleDeactivate(p._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Deactivate">
                              <PowerOff size={15} />
                            </button>
                          )}
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-4">
              <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Product Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, type: "", product: null })} title={modal.type === "create" ? "Add New Product" : "Edit Product"} size="lg">
        {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Product Name *" name="name" value={form.name} onChange={handleFormChange} required placeholder="e.g. Amul Milk 1L" />
          </div>
          <Input label="SKU *" name="sku" value={form.sku} onChange={handleFormChange} required placeholder="e.g. AMUL-MILK-1L" disabled={modal.type === "edit"} />
          <Input label="Barcode" name="barcode" value={form.barcode} onChange={handleFormChange} placeholder="Optional" />
          <Input label="Category *" name="category" value={form.category} onChange={handleFormChange} required placeholder="e.g. Dairy, Beverages" list="categories-list" />
          <datalist id="categories-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          <Select label="Unit *" name="unit" value={form.unit} onChange={handleFormChange} required>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
          <Input label="Cost Price (?) *" name="costPrice" type="number" step="0.01" min="0" value={form.costPrice} onChange={handleFormChange} required />
          <Input label="Selling Price (?) *" name="sellingPrice" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={handleFormChange} required />
          <Input label="Reorder Level *" name="reorderLevel" type="number" min="0" value={form.reorderLevel} onChange={handleFormChange} required />
          <Input label="Safety Stock *" name="safetyStock" type="number" min="0" value={form.safetyStock} onChange={handleFormChange} required />
          <Input label="Target Coverage (Days)" name="targetCoverageDays" type="number" min="1" value={form.targetCoverageDays} onChange={handleFormChange} />
          <Select label="Default Supplier" name="supplier" value={form.supplier} onChange={handleFormChange}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          <div className="sm:col-span-2">
            <Textarea label="Description" name="description" value={form.description} onChange={handleFormChange} placeholder="Optional product description" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, type: "", product: null })}>Cancel</Button>
            <Button type="submit" loading={formLoading}>{modal.type === "create" ? "Create Product" : "Save Changes"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
