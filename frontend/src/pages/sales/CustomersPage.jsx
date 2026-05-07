import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input, Textarea } from '../../design-system/components/atoms/Input';
import Badge from '../../design-system/components/atoms/Badge';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/salesService';
import { fmt, errMsg } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const EMPTY = { name: '', email: '', phone: '', address: '' };

export default function CustomersPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [confirm,   setConfirm]   = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const load = async () => {
    setLoading(true);
    try { setCustomers(await getCustomers({ search })); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(EMPTY); setSelected(null); setModal(true); };
  const openEdit   = (c) => { setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' }); setSelected(c); setModal(true); };
  const closeModal = () => { setModal(false); setSelected(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Customer name is required.');
    setSaving(true);
    try {
      if (selected) { await updateCustomer(selected.id, form); toast.success('Customer updated.'); }
      else { await createCustomer(form); toast.success('Customer added.'); }
      closeModal(); load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteCustomer(confirm.id); toast.success('Customer deactivated.'); setConfirm(null); load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'name',       label: 'Customer',  render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
          {r.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-gray-900">{r.name}</span>
      </div>
    )},
    { key: 'email',      label: 'Email',     render: (r) => <span style={{ color: 'var(--text-tertiary)' }}>{r.email || '—'}</span> },
    { key: 'phone',      label: 'Phone',     render: (r) => r.phone || '—' },
    { key: 'is_active',  label: 'Status',    render: (r) => <Badge label={r.is_active ? 'Active' : 'Inactive'} variant={r.is_active ? 'success' : 'neutral'} dot /> },
    { key: 'created_at', label: 'Since',     render: (r) => fmt.date(r.created_at) },
    { key: 'actions',    label: '', width: 90, render: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(r)} />
        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirm(r)} className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50" />
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.sales.customers')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.sales.title')}</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Add Customer</Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No customers found. Add your first customer."
        searchable
        searchPlaceholder="Search customers…"
        striped
      />

      <Modal open={modal} onClose={closeModal} title={selected ? 'Edit Customer' : 'New Customer'}>
        <div className="space-y-4">
          <Input label="Full Name *" placeholder="e.g. Acme Corp" value={form.name} onChange={field('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={field('email')} />
            <Input label="Phone" placeholder="+1 555 0000" value={form.phone} onChange={field('phone')} />
          </div>
          <Textarea label="Address" placeholder="Street, City, Country" value={form.address} onChange={field('address')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{selected ? 'Save Changes' : 'Add Customer'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate Customer"
        message={`Deactivate "${confirm?.name}"? They won't appear in new orders.`}
        variant="warning"
      />
    </div>
  );
}
