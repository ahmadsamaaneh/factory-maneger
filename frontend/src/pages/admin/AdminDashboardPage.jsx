import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowRight, Users, UserCheck, UserX, RefreshCw,
} from 'lucide-react';
import { StatCard } from '../../design-system/components/organisms/Card';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import Button from '../../design-system/components/atoms/Button';
import Badge from '../../design-system/components/atoms/Badge';
import { getAdminStats, listFactories } from '../../services/factoryService';
import toast from 'react-hot-toast';
import { errMsg } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const STATUS_META = {
  active:    { variant: 'success', label: 'Active' },
  trial:     { variant: 'info',    label: 'Trial' },
  expired:   { variant: 'danger',  label: 'Expired' },
  suspended: { variant: 'warning', label: 'Suspended' },
};

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [sRes, fRes] = await Promise.all([getAdminStats(), listFactories()]);
      setStats(sRes.data.data);
      setFactories(fRes.data.data.slice(0, 8));
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{t('pages.admin.dashboard')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            System overview — manage factories and subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>Refresh</Button>
          <Button variant="outline" icon={Users} onClick={() => navigate('/admin/users')}>
            All Users
          </Button>
          <Button icon={Building2} onClick={() => navigate('/admin/factories')}>
            Manage Factories
          </Button>
        </div>
      </div>

      {/* Factory stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Factories"
            value={stats.total}
            icon={Building2}
            colorClass="text-primary-600 bg-primary-50 dark:bg-primary-900/30"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={CheckCircle2}
            colorClass="text-success-600 bg-success-50 dark:bg-success-900/30"
          />
          <StatCard
            label="Trial"
            value={stats.trial}
            icon={Clock}
            colorClass="text-info-600 bg-info-50 dark:bg-info-900/30"
          />
          <StatCard
            label="Expired / Suspended"
            value={(stats.expired ?? 0) + (stats.suspended ?? 0)}
            icon={XCircle}
            colorClass="text-danger-600 bg-danger-50 dark:bg-danger-900/30"
          />
        </div>
      )}

      {/* User stats */}
      {stats && (
        <div
          className="grid grid-cols-3 gap-4 p-4 rounded-xl border cursor-pointer hover:opacity-90 transition-opacity"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}
          onClick={() => navigate('/admin/users')}
        >
          {[
            { label: 'Total Users',    value: stats.total_users,    icon: Users,      color: 'text-primary-600' },
            { label: 'Active Users',   value: stats.active_users,   icon: UserCheck,  color: 'text-success-600' },
            { label: 'Disabled Users', value: stats.disabled_users, icon: UserX,      color: 'text-danger-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={18} className={color} />
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? 0}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent factories */}
      <div className="card p-0 overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Factories
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/admin/factories')}
          >
            View all
          </Button>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {factories.length === 0 && (
            <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
              No factories yet. Create the first one.
            </p>
          )}
          {factories.map((f) => {
            const meta = STATUS_META[f.subscription_status] || STATUS_META.trial;
            const used = f.user_count ?? 0;
            const limit = f.email_limit ?? 10;
            const pct = Math.min((used / limit) * 100, 100);
            return (
              <div
                key={f.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:cursor-pointer transition-colors"
                style={{ ':hover': { backgroundColor: 'var(--bg-subtle)' } }}
                onClick={() => navigate(`/admin/factories/${f.id}`)}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <Building2 size={15} className="text-primary-600 dark:text-primary-400" />
                </div>

                {/* Name + owner */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {f.name}
                  </p>
                  {f.owner && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {f.owner.email}
                    </p>
                  )}
                </div>

                {/* User usage */}
                <div className="hidden sm:flex flex-col gap-1 w-24">
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Users size={11} />
                    <span>{used}/{limit}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          pct >= 100 ? 'var(--color-danger-500)'
                          : pct >= 80 ? 'var(--color-warning-500)'
                          : 'var(--color-primary-500)',
                      }}
                    />
                  </div>
                </div>

                {/* Status badge */}
                <Badge label={meta.label} variant={meta.variant} size="sm" />

                <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning: expired/suspended */}
      {stats && (stats.expired > 0 || stats.suspended > 0) && (
        <div className="flex items-start gap-3 p-4 rounded-xl border"
          style={{
            backgroundColor: 'var(--danger-50)',
            borderColor: 'var(--danger-200)',
          }}
        >
          <AlertTriangle size={16} className="text-danger-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-danger-700">
              {stats.expired + stats.suspended} factory subscription{stats.expired + stats.suspended > 1 ? 's' : ''} need attention
            </p>
            <p className="text-xs text-danger-600 mt-0.5">
              {stats.expired} expired · {stats.suspended} suspended — users in these factories cannot log in.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-danger-600 shrink-0"
            onClick={() => navigate('/admin/factories')}
          >
            Review
          </Button>
        </div>
      )}
    </div>
  );
}
