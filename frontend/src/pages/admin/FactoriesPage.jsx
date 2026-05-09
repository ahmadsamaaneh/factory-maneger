import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Building2, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Button from '../../design-system/components/atoms/Button';
import Badge from '../../design-system/components/atoms/Badge';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import { Input } from '../../design-system/components/atoms/Input';
import { StatCard } from '../../design-system/components/organisms/Card';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import {
  listFactories,
  createFactory,
  updateFactory,
  deleteFactory,
  getAdminStats,
} from '../../services/factoryService';
import { errMsg } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const STATUS_BADGE = {
  active:    { variant: 'success',  label: 'نشط' },
  trial:     { variant: 'info',     label: 'تجريبي' },
  expired:   { variant: 'danger',   label: 'منتهي' },
  suspended: { variant: 'warning',  label: 'موقوف' },
};

const emptyForm = () => ({
  name: '', owner_name: '', owner_email: '', owner_password: '',
  email_limit: 10, subscription_status: 'trial', subscription_end_date: '',
});

export default function FactoriesPage() {
  const { t } = useTranslation();
  const [factories, setFactories]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal]   = useState(null);
  const [confirm, setConfirm]       = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const [facRes, statsRes] = await Promise.all([listFactories(), getAdminStats()]);
      setFactories(facRes.data.data);
      setStats(statsRes.data.data);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.owner_name || !form.owner_email || !form.owner_password) {
      return toast.error('كل الحقول مطلوبة.');
    }
    try {
      setSaving(true);
      await createFactory(form);
      toast.success('تم إنشاء المصنع بنجاح.');
      setCreateModal(false);
      setForm(emptyForm());
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    try {
      setSaving(true);
      await updateFactory(editModal.id, editForm);
      toast.success('تم تحديث المصنع.');
      setEditModal(null);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteFactory(confirm.id);
      toast.success('تم تعطيل المصنع.');
      setConfirm(null);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  const openEdit = (f) => {
    setEditForm({
      name: f.name,
      email_limit: f.email_limit ?? 10,
      subscription_status: f.subscription_status,
      subscription_end_date: f.subscription_end_date || '',
      is_active: f.is_active,
    });
    setEditModal(f);
  };

  const columns = [
    {
      key: 'name', label: 'Factory', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-100 dark:bg-primary-900/40">
            <Building2 size={14} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {r.is_active ? 'Active account' : 'Deactivated'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner', label: 'Owner',
      render: (r) => r.owner
        ? <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{r.owner.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.owner.email}</p>
          </div>
        : <span style={{ color: 'var(--text-tertiary)' }}>—</span>,
    },
    {
      key: 'subscription_status', label: 'Subscription', sortable: true,
      render: (r) => {
        const b = STATUS_BADGE[r.subscription_status] || { variant: 'neutral', label: r.subscription_status };
        return <Badge variant={b.variant} label={b.label} dot size="sm" />;
      },
    },
    {
      key: 'subscription_end_date', label: 'Expiry', sortable: true,
      render: (r) => r.subscription_end_date
        ? <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {new Date(r.subscription_end_date).toLocaleDateString()}
          </span>
        : <span style={{ color: 'var(--text-tertiary)' }}>—</span>,
    },
    {
      key: 'user_count', label: 'Users',
      render: (r) => {
        const used = r.user_count ?? 0;
        const limit = r.email_limit ?? 10;
        const pct = Math.min((used / limit) * 100, 100);
        const isNear = pct >= 80;
        return (
          <div className="flex flex-col gap-1 min-w-[90px]">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: isNear ? 'var(--danger-600)' : 'var(--text-secondary)' }}>
                {used}/{limit}
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct >= 100 ? 'var(--color-danger-500)' : pct >= 80 ? 'var(--color-warning-500)' : 'var(--color-primary-500)',
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions', label: '', width: 160,
      render: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/factories/${r.id}`)}>Details</Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
          <Button
            variant="ghost" size="sm"
            className="text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20"
            onClick={(e) => { e.stopPropagation(); setConfirm(r); }}
          >
            ✕
          </Button>
        </div>
      ),
    },
  ];

  if (loading && !factories.length) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{t('pages.admin.factories')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {t('pages.admin.dashboard')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>{t('common.refresh')}</Button>
          <Button icon={Plus} onClick={() => { setForm(emptyForm()); setCreateModal(true); }}>
            {t('pages.admin.addFactory')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="إجمالي المصانع"  value={stats.total}     icon={Building2}    colorClass="text-primary-600 bg-primary-50 dark:bg-primary-900/30" />
          <StatCard label="نشط"           value={stats.active}    icon={CheckCircle2} colorClass="text-success-600 bg-success-50 dark:bg-success-900/30" />
          <StatCard label="منتهي"          value={stats.expired}   icon={XCircle}      colorClass="text-danger-600 bg-danger-50 dark:bg-danger-900/30" />
          <StatCard label="تجريبي"            value={stats.trial}     icon={Clock}        colorClass="text-warning-600 bg-warning-50 dark:bg-warning-900/30" />
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={factories}
        loading={loading}
        striped
        emptyMessage="لا توجد مصانع بعد. أنشئ أول مصنع."
      />

      {/* ── Create Factory Modal ── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="مصنع جديد" size="md">
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>تفاصيل المصنع</p>
          <Input
            label="اسم المصنع *"
            placeholder="مثال: مصنع..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <div className="border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>حساب المالك</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="اسم المالك *"
                placeholder="الاسم الكامل"
                value={form.owner_name}
                onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
              />
              <Input
                label="بريد المالك *"
                type="email"
                placeholder="owner@company.com"
                value={form.owner_email}
                onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
              />
            </div>
            <div className="mt-3">
              <Input
                label="كلمة مرور المالك *"
                type="password"
                placeholder="8 أحرف على الأقل"
                value={form.owner_password}
                onChange={(e) => setForm((f) => ({ ...f, owner_password: e.target.value }))}
              />
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>الاشتراك والحدود</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>الحالة</label>
                <select
                  value={form.subscription_status}
                  onChange={(e) => setForm((f) => ({ ...f, subscription_status: e.target.value }))}
                  className="ds-input h-9 text-sm"
                >
                  <option value="trial">تجريبي</option>
                  <option value="active">نشط</option>
                  <option value="expired">منتهي</option>
                  <option value="suspended">موقوف</option>
                </select>
              </div>
              <Input
                label="تاريخ الانتهاء"
                type="date"
                value={form.subscription_end_date}
                onChange={(e) => setForm((f) => ({ ...f, subscription_end_date: e.target.value }))}
              />
            </div>
            <div className="mt-3">
              <Input
                label="حد المستخدمين"
                type="number"
                min="1"
                max="500"
                placeholder="10"
                value={form.email_limit || ''}
                onChange={(e) => setForm((f) => ({ ...f, email_limit: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateModal(false)}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreate}>إنشاء المصنع</Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit / Manage Modal ── */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={`Manage: ${editModal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Factory Name"
            value={editForm.name || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Subscription Status</label>
            <select
              value={editForm.subscription_status || 'trial'}
              onChange={(e) => setEditForm((f) => ({ ...f, subscription_status: e.target.value }))}
              className="ds-input h-9 text-sm"
            >
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <Input
            label="Subscription Expiry Date"
            type="date"
            value={editForm.subscription_end_date || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, subscription_end_date: e.target.value || null }))}
          />

          <Input
            label="User Limit"
            type="number"
            min="1"
            max="500"
            value={editForm.email_limit || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, email_limit: parseInt(e.target.value) || 10 }))}
          />

          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={editForm.is_active ?? true}
                onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded"
              />
              Account is active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Deactivate ── */}
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate Factory"
        message={`Deactivate "${confirm?.name}"? Users will lose access immediately.`}
        variant="warning"
      />
    </div>
  );
}
