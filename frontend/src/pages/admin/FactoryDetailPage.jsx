import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Users, Calendar, RefreshCw,
  CheckCircle2, XCircle, Clock, AlertTriangle, ShieldOff, Crown, UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../design-system/components/atoms/Button';
import Badge from '../../design-system/components/atoms/Badge';
import { StatCard } from '../../design-system/components/organisms/Card';
import Modal from '../../design-system/components/organisms/Modal';
import { Input } from '../../design-system/components/atoms/Input';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import DataTable from '../../design-system/components/organisms/DataTable';
import { getFactory, getFactoryUsers, updateFactory } from '../../services/factoryService';
import { fmt, errMsg } from '../../utils/formatters';

const STATUS_META = {
  active:    { variant: 'success', label: 'نشط',    icon: CheckCircle2 },
  trial:     { variant: 'info',    label: 'تجريبي',     icon: Clock },
  expired:   { variant: 'danger',  label: 'منتهي',   icon: XCircle },
  suspended: { variant: 'warning', label: 'موقوف', icon: AlertTriangle },
};

const ROLE_LABELS = {
  factory_owner:      'مالك',
  inventory_manager:  'مخزون',
  production_manager: 'إنتاج',
  sales_manager:      'مبيعات',
  admin:              'مسؤول',
};

export default function FactoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [factory, setFactory]   = useState(null);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [fRes, uRes] = await Promise.all([getFactory(id), getFactoryUsers(id)]);
      setFactory(fRes.data.data);
      setUsers(uRes.data.data);
      const f = fRes.data.data;
      setForm({
        name: f.name,
        email_limit: f.email_limit ?? 10,
        subscription_status: f.subscription_status,
        subscription_end_date: f.subscription_end_date || '',
        is_active: f.is_active,
      });
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateFactory(id, form);
      toast.success('تم تحديث المصنع.');
      setEditModal(false);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const userColumns = [
    {
      key: 'name', label: 'الاسم', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          {r.role === 'factory_owner' && (
            <Crown size={13} className="text-warning-500 shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'الدور',
      render: (r) => (
        <Badge
          label={ROLE_LABELS[r.role] || r.role}
          variant={r.role === 'factory_owner' ? 'warning' : 'neutral'}
          size="sm"
        />
      ),
    },
    {
      key: 'is_active', label: 'الحالة',
      render: (r) => (
        <Badge
          label={r.is_active ? 'نشط' : 'غير نشط'}
          variant={r.is_active ? 'success' : 'neutral'}
          dot
          size="sm"
        />
      ),
    },
    {
      key: 'created_at', label: 'تاريخ الانضمام', sortable: true,
      render: (r) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {fmt.date(r.created_at)}
        </span>
      ),
    },
  ];

  if (loading) return <PageSpinner />;
  if (!factory) return null;

  const meta = STATUS_META[factory.subscription_status] || STATUS_META.trial;
  const StatusIcon = meta.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/admin/factories')}>
            رجوع
          </Button>
          <div>
            <h1 className="flex items-center gap-2">
              <Building2 size={20} />
              {factory.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              معرف المصنع: {factory.id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>تحديث</Button>
          <Button onClick={() => setEditModal(true)}>إدارة الاشتراك</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Status"
          value={meta.label}
          icon={StatusIcon}
          colorClass={
            factory.subscription_status === 'active'  ? 'text-success-600 bg-success-50 dark:bg-success-900/30' :
            factory.subscription_status === 'trial'   ? 'text-info-600 bg-info-50 dark:bg-info-900/30' :
            factory.subscription_status === 'expired' ? 'text-danger-600 bg-danger-50 dark:bg-danger-900/30' :
                                                        'text-warning-600 bg-warning-50 dark:bg-warning-900/30'
          }
        />
        <StatCard
          label="Users (used/limit)"
          value={`${users.length} / ${factory.email_limit}`}
          icon={Users}
          colorClass="text-primary-600 bg-primary-50 dark:bg-primary-900/30"
        />
        <StatCard
          label="Expiry Date"
          value={factory.subscription_end_date ? fmt.date(factory.subscription_end_date) : '—'}
          icon={Calendar}
          colorClass="text-neutral-600 bg-neutral-100 dark:bg-neutral-800"
        />
        <StatCard
          label="Account"
          value={factory.is_active ? 'Active' : 'Deactivated'}
          icon={factory.is_active ? CheckCircle2 : ShieldOff}
          colorClass={factory.is_active ? 'text-success-600 bg-success-50 dark:bg-success-900/30' : 'text-danger-600 bg-danger-50 dark:bg-danger-900/30'}
        />
      </div>

      {/* Owner info */}
      {factory.owner && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Crown size={14} className="text-warning-500" />
            Factory Owner
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-warning-100 dark:bg-warning-900/40 flex items-center justify-center text-warning-700 dark:text-warning-300 font-bold text-sm">
              {factory.owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{factory.owner.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{factory.owner.email}</p>
            </div>
            <Badge label="Owner" variant="warning" size="sm" className="ml-auto" />
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Factory Users ({users.length})
          </h2>
        </div>
        <DataTable
          columns={userColumns}
          data={users}
          loading={loading}
          emptyMessage="No users in this factory yet."
          striped
        />
      </div>

      {/* Manage Subscription Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Manage: ${factory.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Factory Name"
            value={form.name || ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              Subscription Status
            </label>
            <select
              value={form.subscription_status || 'trial'}
              onChange={(e) => setForm((f) => ({ ...f, subscription_status: e.target.value }))}
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
            value={form.subscription_end_date || ''}
            onChange={(e) => setForm((f) => ({ ...f, subscription_end_date: e.target.value || null }))}
          />

          <Input
            label="User Limit"
            type="number"
            min="1"
            max="500"
            value={form.email_limit || ''}
            onChange={(e) => setForm((f) => ({ ...f, email_limit: parseInt(e.target.value) || 10 }))}
          />

          <div
            className="flex items-center gap-2 p-3 rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active ?? true}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
              Account is active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
