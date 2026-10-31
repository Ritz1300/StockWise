import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Truck } from "lucide-react";
import { getSuppliers, createSupplier, updateSupplier } from "../../api/suppliers";
import { Card, Table, Th, Td, Button, Badge, LoadingState, EmptyState, Modal, Input, Textarea, Pagination } from "../../components/ui/index";
import { useAuth } from "../../contexts/AuthContext";

const SuppliersPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole("owner", "manager");

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState({ open: false, supplier: null });
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "", leadTimeDays: "3", notes: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSuppliers({ page, limit: 20 });
      setSuppliers(res.data.data);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openModal = (supplier = null) => {
    setFormError("");
    setModal({ open: true, supplier });
    setForm(supplier ? { name: supplier.name, contactPerson: supplier.contactPerson || "", phone: supplier.phone || "", email: supplier.email || "", address: supplier.address || "", leadTimeDays: supplier.leadTimeDays || 3, notes: supplier.notes || "" } : { name: "", contactPerson: "", phone: "", email: "", address: "", leadTimeDays: "3", notes: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      if (modal.supplier) await updateSupplier(modal.supplier._id, { ...form, leadTimeDays: parseInt(form.leadTimeDays) });
      else await createSupplier({ ...form, leadTimeDays: parseInt(form.leadTimeDays) });
      setModal({ open: false, supplier: null });
      fetchSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save supplier");
    } finally {
      setFormLoading(false);
    }
  };

  const fields = [
    { name: "name", label: "Supplier Name *", required: true, placeholder: "e.g. Metro Cash & Carry", colSpan: 2 },
    { name: "contactPerson", label: "Contact Person", placeholder: "e.g. Ramesh Kumar" },
    { name: "phone", label: "Phone Number", placeholder: "+91 98765 43210" },
    { name: "email", label: "Email Address", type: "email", placeholder: "supplier@example.com" },
    { name: "leadTimeDays", label: "Lead Time (Days)", type: "number", min: "0", placeholder: "3" },
    { name: "address", label: "Address", placeholder: "Full address", colSpan: 2 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {canEdit && <Button onClick={() => openModal()}><Plus size={16} /> Add Supplier</Button>}
      </div>

      <Card>
        {loading ? <LoadingState /> : suppliers.length === 0 ? (
          <EmptyState icon={Truck} title="No suppliers yet" description="Add your first supplier." action={canEdit ? <Button onClick={() => openModal()}><Plus size={16} />Add Supplier</Button> : null} />
        ) : (
          <>
            <Table>
              <thead><tr><Th>Supplier Name</Th><Th>Contact Person</Th><Th>Phone</Th><Th>Email</Th><Th>Lead Time</Th><Th>Status</Th>{canEdit && <Th>Actions</Th>}</tr></thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <Td className="font-medium">{s.name}</Td>
                    <Td className="text-gray-500">{s.contactPerson || "-"}</Td>
                    <Td className="text-gray-500">{s.phone || "-"}</Td>
                    <Td className="text-gray-500">{s.email || "-"}</Td>
                    <Td className="text-gray-500">{s.leadTimeDays} days</Td>
                    <Td><Badge color={s.isActive ? "green" : "gray"}>{s.isActive ? "Active" : "Inactive"}</Badge></Td>
                    {canEdit && (
                      <Td>
                        <button onClick={() => openModal(s)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                          <Edit2 size={15} />
                        </button>
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

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, supplier: null })} title={modal.supplier ? "Edit Supplier" : "Add Supplier"} size="md">
        {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
              <Input label={f.label} name={f.name} type={f.type || "text"} min={f.min} value={form[f.name]} onChange={(e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))} required={f.required} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Textarea label="Notes" name="notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, supplier: null })}>Cancel</Button>
            <Button type="submit" loading={formLoading}>{modal.supplier ? "Save Changes" : "Add Supplier"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
