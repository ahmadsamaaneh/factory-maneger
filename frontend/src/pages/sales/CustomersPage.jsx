import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

const EMPTY = { name: '', email: '', phone: '', address: '', is_active: true };

function phoneDigitCount(s) {
  return String(s || '').replace(/\D/g, '').length;
}

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
  const [statusSaving, setStatusSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setCustomers(await getCustomers({ search })); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm({ ...EMPTY }); setSelected(null); setModal(true); };
  const openEdit   = (c) => {
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      is_active: Boolean(c.is_active),
    });
    setSelected(c);
    setModal(true);
  };
  const closeModal = () => { setModal(false); setSelected(null); };

  const handleStatusChange = async (customer, isActive) => {
    if (isActive === customer.is_active) return;
    setStatusSaving(customer.id);
    try {
      await updateCustomer(customer.id, { is_active: isActive });
      toast.success('تم تحديث حالة العميل.');
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setStatusSaving(null);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('اسم العميل مطلوب.');
    const digits = phoneDigitCount(form.phone);
    if (digits > 0 && digits < 10) {
      return toast.error('رقم الهاتف يجب أن يحتوي على 10 أرقام على الأقل (بدون احتساب المسافات والرموز).');
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        is_active: form.is_active,
      };
      if (selected) { await updateCustomer(selected.id, payload); toast.success('تم تحديث العميل.'); }
      else { await createCustomer(payload); toast.success('تمت إضافة العميل.'); }
      closeModal(); load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteCustomer(confirm.id); toast.success('تم تعطيل العميل.'); setConfirm(null); load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'name',       label: 'العميل',  render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
          {r.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-gray-900">{r.name}</span>
      </div>
    )},
    { key: 'email',      label: 'البريد الإلكتروني',     render: (r) => <span style={{ color: 'var(--text-tertiary)' }}>{r.email || '—'}</span> },
    { key: 'phone',      label: 'الهاتف',     render: (r) => r.phone || '—' },
    {
      key: 'is_active',
      label: 'الحالة',
      width: 150,
      render: (r) => (
        <select
          className="ds-input h-9 text-sm min-w-[8rem]"
          value={r.is_active ? 'true' : 'false'}
          disabled={statusSaving === r.id}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value === 'true';
            handleStatusChange(r, v);
          }}
        >
          <option value="true">نشط</option>
          <option value="false">غير نشط</option>
        </select>
      ),
    },
    { key: 'created_at', label: 'منذ',     render: (r) => fmt.date(r.created_at) },
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
        <Button icon={Plus} onClick={openCreate}>إضافة عميل</Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="لا يوجد عملاء. أضف أول عميل."
        searchable
        searchPlaceholder="ابحث عن عميل…"
        striped
      />

      <Modal open={modal} onClose={closeModal} title={selected ? 'تعديل العميل' : 'عميل جديد'}>
        <div className="space-y-4">
          <Input label="الاسم الكامل *" placeholder="مثال: شركة..." value={form.name} onChange={field('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="البريد الإلكتروني" type="email" placeholder="email@example.com" value={form.email} onChange={field('email')} />
            <Input
              label="الهاتف"
              placeholder="مثال: 0591234567"
              value={form.phone}
              onChange={field('phone')}
              helperText="إن أدخلت رقمًا يجب أن يحتوي على 10 أرقام على الأقل (يُحسب الأرقام فقط). اتركه فارغًا إن لم يتوفر."
            />
          </div>
          <Textarea label="العنوان" placeholder="الشارع، المدينة، الدولة" value={form.address} onChange={field('address')} />
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>حالة العميل</label>
            <select
              className="ds-input h-9 text-sm w-full"
              value={form.is_active ? 'true' : 'false'}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'true' }))}
            >
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{selected ? 'حفظ التغييرات' : 'إضافة عميل'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="تعطيل العميل"
        message={`تعطيل "${confirm?.name}"؟ لن يظهر في الطلبات الجديدة.`}
        variant="warning"
      />
    </div>
  );
}
