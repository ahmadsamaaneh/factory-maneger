import { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, RefreshCw, ShieldOff, ShieldCheck,
  KeyRound, Building2, Crown, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../design-system/components/atoms/Button';
import Badge from '../../design-system/components/atoms/Badge';
import { Input } from '../../design-system/components/atoms/Input';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { listAllUsers, toggleUserStatus, resetUserPassword } from '../../services/factoryService';
import { errMsg, fmt } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const ROLE_LABELS = {
  factory_owner:      { label: 'Owner',      variant: 'warning' },
  inventory_manager:  { label: 'Inventory',  variant: 'info' },
  production_manager: { label: 'Production', variant: 'neutral' },
  sales_manager:      { label: 'Sales',      variant: 'success' },
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');

  const [toggleTarget, setToggleTarget] = useState(null);  // user to toggle
  const [toggling, setToggling]         = useState(false);

  const [resetTarget, setResetTarget]   = useState(null);  // user to reset password
  const [newPwd, setNewPwd]             = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [resetting, setResetting]       = useState(false);

  const [detailUser, setDetailUser]     = useState(null);  // user detail modal

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await listAllUsers(params);
      setUsers(res.data.data);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    try {
      setToggling(true);
      await toggleUserStatus(toggleTarget.id);
      toast.success(`User ${toggleTarget.is_active ? 'disabled' : 'enabled'} successfully.`);
      setToggleTarget(null);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setToggling(false); }
  };

  const handleResetPassword = async () => {
    try {
      setResetting(true);
      await resetUserPassword(resetTarget.id, newPwd);
      toast.success(`Password reset for ${resetTarget.email}.`);
      setResetTarget(null);
      setNewPwd('');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setResetting(false); }
  };

  const columns = [
    {
      key: 'name', label: 'User', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: r.is_active ? 'var(--color-primary-500)' : 'var(--color-neutral-400)' }}>
            {r.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'factory', label: 'Factory',
      render: (r) => r.factory ? (
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Building2 size={13} />
          {r.factory.name}
        </div>
      ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>,
    },
    {
      key: 'role', label: 'Role',
      render: (r) => {
        const meta = ROLE_LABELS[r.role] || { label: r.role, variant: 'neutral' };
        return (
          <div className="flex items-center gap-1.5">
            {r.role === 'factory_owner' && <Crown size={11} className="text-warning-500" />}
            <Badge label={meta.label} variant={meta.variant} size="sm" />
          </div>
        );
      },
    },
    {
      key: 'is_active', label: 'Status',
      render: (r) => (
        <Badge
          label={r.is_active ? 'Active' : 'Disabled'}
          variant={r.is_active ? 'success' : 'danger'}
          dot
          size="sm"
        />
      ),
    },
    {
      key: 'last_login', label: 'Last Login', sortable: true,
      render: (r) => r.last_login
        ? <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{fmt.dateTime(r.last_login)}</span>
        : <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Never</span>,
    },
    {
      key: 'created_at', label: 'Joined', sortable: true,
      render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{fmt.date(r.created_at)}</span>
      ),
    },
    {
      key: 'actions', label: '', width: 140,
      render: (r) => (
        <div className="flex gap-1">
          <Button
            variant="ghost" size="sm"
            icon={Eye}
            onClick={() => setDetailUser(r)}
          />
          <Button
            variant="ghost" size="sm"
            icon={KeyRound}
            onClick={() => { setResetTarget(r); setNewPwd(''); setShowPwd(false); }}
          />
          <Button
            variant="ghost" size="sm"
            icon={r.is_active ? ShieldOff : ShieldCheck}
            className={r.is_active
              ? 'text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20'
              : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'}
            onClick={() => setToggleTarget(r)}
          />
        </div>
      ),
    },
  ];

  const activeCount   = users.filter((u) => u.is_active).length;
  const disabledCount = users.filter((u) => !u.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <Users size={20} />
            {t('pages.admin.users')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {t('pages.users.subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>{t('common.refresh')}</Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',    value: users.length,  color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' },
          { label: 'Active',   value: activeCount,   color: 'text-success-600 bg-success-50 dark:bg-success-900/30' },
          { label: 'Disabled', value: disabledCount, color: 'text-danger-600 bg-danger-50 dark:bg-danger-900/30' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.color}`}>
            <Users size={18} />
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="ds-input pl-9 h-9 text-sm w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="ds-input h-9 text-sm w-full sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading && !users.length
          ? <PageSpinner />
          : (
            <DataTable
              columns={columns}
              data={users}
              loading={loading}
              striped
              emptyMessage="No users found."
            />
          )
        }
      </div>

      {/* ── Toggle status confirm ── */}
      {toggleTarget && (
        <ConfirmModal
          open
          title={toggleTarget.is_active ? 'Disable User?' : 'Enable User?'}
          message={
            toggleTarget.is_active
              ? `${toggleTarget.name} will be disabled and cannot log in until re-enabled.`
              : `${toggleTarget.name} will be re-enabled and can log in again.`
          }
          confirmLabel={toggleTarget.is_active ? 'Disable' : 'Enable'}
          variant={toggleTarget.is_active ? 'danger' : 'primary'}
          loading={toggling}
          onConfirm={handleToggle}
          onClose={() => setToggleTarget(null)}
        />
      )}

      {/* ── Reset password modal ── */}
      {resetTarget && (
        <Modal
          open
          onClose={() => setResetTarget(null)}
          title={`Reset Password — ${resetTarget.name}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Set a new password for <strong>{resetTarget.email}</strong>.
              The user will need to use this password on their next login.
            </p>
            <div className="relative">
              <Input
                label="New Password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-8"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setResetTarget(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                icon={KeyRound}
                loading={resetting}
                disabled={newPwd.length < 8}
                onClick={handleResetPassword}
              >
                Reset Password
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── User detail modal ── */}
      {detailUser && (
        <Modal
          open
          onClose={() => setDetailUser(null)}
          title="User Details"
          size="sm"
        >
          <div className="space-y-3">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: detailUser.is_active ? 'var(--color-primary-500)' : 'var(--color-neutral-400)' }}>
                {detailUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{detailUser.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detailUser.email}</p>
              </div>
              <Badge
                label={detailUser.is_active ? 'Active' : 'Disabled'}
                variant={detailUser.is_active ? 'success' : 'danger'}
                dot
                className="ml-auto"
              />
            </div>

            {[
              { label: 'Role',       value: ROLE_LABELS[detailUser.role]?.label || detailUser.role },
              { label: 'Factory',    value: detailUser.factory?.name || '—' },
              { label: 'Last Login', value: detailUser.last_login ? fmt.dateTime(detailUser.last_login) : 'Never' },
              { label: 'Joined',     value: fmt.date(detailUser.created_at) },
              { label: 'User ID',    value: detailUser.id },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 text-sm">
                <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                <span className="font-medium text-right break-all" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}

            <div className="flex gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button
                variant={detailUser.is_active ? 'danger' : 'primary'}
                size="sm"
                className="flex-1"
                icon={detailUser.is_active ? ShieldOff : ShieldCheck}
                onClick={() => { setDetailUser(null); setToggleTarget(detailUser); }}
              >
                {detailUser.is_active ? 'Disable' : 'Enable'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={KeyRound}
                onClick={() => { setDetailUser(null); setResetTarget(detailUser); setNewPwd(''); setShowPwd(false); }}
              >
                Reset Password
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
