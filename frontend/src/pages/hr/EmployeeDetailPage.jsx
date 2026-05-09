import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import Badge from '../../design-system/components/atoms/Badge';
import Card, { CardBody, CardHeader } from '../../design-system/components/organisms/Card';
import { getEmployee } from '../../services/hrService';
import { fmt, errMsg } from '../../utils/formatters';
import { cn } from '../../design-system/utils/cn';

const TABS = [
  'personal',
  'schedule',
  'payroll',
  'loans',
  'leaves',
  'evaluation',
  'skills',
  'files',
  'activity',
];

const STATUS_VARIANT = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'neutral',
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setEmp(null);
    getEmployee(id)
      .then(setEmp)
      .catch((e) => {
        toast.error(errMsg(e));
        setEmp(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;
  if (!emp) {
    return (
      <div className="card p-8 text-center space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('pages.hr.employeeNotFound')}</p>
        <Link to="/hr/employees" className="text-sm font-medium text-primary-600 hover:underline">
          {t('pages.hr.backToStaff')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <Link
            to="/hr/employees"
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={18} className="rtl-flip" />
          </Link>
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
              <User size={28} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate">{emp.full_name}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {emp.employee_code}
              {emp.department?.name ? ` · ${emp.department.name}` : ''}
            </p>
            <div className="mt-2">
              <Badge
                label={t(`pages.hr.status.${emp.status}`, { defaultValue: emp.status })}
                variant={STATUS_VARIANT[emp.status] || 'neutral'}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors',
              tab === key
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/80',
            )}
          >
            {t(`pages.hr.tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <Card>
          <CardHeader title={t('pages.hr.tabs.personal')} />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.jobTitle')}</p>
              <p className="mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{emp.job_title || '—'}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('common.email')}</p>
              <p className="mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{emp.email || '—'}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('common.phone')}</p>
              <p className="mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{emp.phone || '—'}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.nationalId')}</p>
              <p className="mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{emp.national_id || '—'}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.hireDate')}</p>
              <p className="mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{fmt.date(emp.hire_date)}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.baseSalary')}</p>
              <p className="mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{fmt.currency(emp.salary_base)}</p>
            </div>
            {emp.linkedUser && (
              <div className="sm:col-span-2">
                <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.linkedUser')}</p>
                <p className="mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {emp.linkedUser.name} ({emp.linkedUser.email}) — {fmt.role(emp.linkedUser.role)}
                </p>
              </div>
            )}
            {emp.notes && (
              <div className="sm:col-span-2">
                <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.notes')}</p>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{emp.notes}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab !== 'personal' && (
        <Card padding="md">
          <p className="text-sm text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
            {t('pages.hr.comingSoon')}
          </p>
        </Card>
      )}
    </div>
  );
}
