import { useEffect, useMemo, useState } from 'react';
import {
  Users, UserCheck, UserX, Clock, Bell, Wallet, PieChart, CalendarDays,
  FileBarChart2, ArrowRightLeft, Siren, ShieldCheck,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import Card, { CardBody, CardHeader, StatCard } from '../../design-system/components/organisms/Card';
import Badge from '../../design-system/components/atoms/Badge';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { Link } from 'react-router-dom';
import { buttonVariants } from '../../design-system/components/atoms/Button';
import { cn } from '../../design-system/utils/cn';
import { getDailyAttendance, getHrStats, getMonthlyPayrollReport } from '../../services/hrService';
import { fmt, errMsg } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function HrDashboardPage() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([
      getHrStats(),
      getDailyAttendance(new Date().toISOString().slice(0, 10)),
      getMonthlyPayrollReport(month),
    ])
      .then(([s, d, p]) => {
        setStats(s);
        setDaily(d);
        setPayroll(p);
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const attendanceBreakdown = useMemo(() => {
    const items = daily?.items || [];
    const late = items.filter((x) => Number(x.late_minutes || 0) > 0).length;
    const sick = items.filter((x) => x.status === 'sick_leave').length;
    const leave = items.filter((x) => x.status === 'leave').length;
    return { late, sick, leave };
  }, [daily]);

  const topLateEmployees = useMemo(() => {
    return [...(daily?.items || [])]
      .filter((x) => Number(x.late_minutes || 0) > 0)
      .sort((a, b) => Number(b.late_minutes || 0) - Number(a.late_minutes || 0))
      .slice(0, 5);
  }, [daily]);

  const payrollTrend = useMemo(() => {
    if (!payroll) return [];
    return [
      { name: 'الأساسي', value: Number(payroll.totals.base_salary || 0) },
      { name: 'الخصومات', value: Number(payroll.totals.deductions || 0) },
      { name: 'الإضافي', value: Number(payroll.totals.overtime_pay || 0) },
      { name: 'بدل الجمعة', value: Number(payroll.totals.friday_bonus || 0) },
      { name: 'الصافي', value: Number(payroll.totals.net_salary || 0) },
    ];
  }, [payroll]);

  if (loading || !stats || !daily || !payroll) return <PageSpinner />;

  const chartData = [
    { name: 'حاضر', value: stats.present_today },
    { name: 'غائب', value: stats.absent_today },
    { name: 'متأخر', value: stats.late_today },
    { name: 'مرضي', value: attendanceBreakdown.sick },
    { name: 'إجازة', value: attendanceBreakdown.leave },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1>لوحة الموارد البشرية</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            تشغيل يومي احترافي للموظفين — الحضور، الرواتب، والتنبيهات التنفيذية.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/hr/employees" className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}>
            <Users size={15} /> الموظفون
          </Link>
          <Link to="/hr/attendance" className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}>
            <CalendarDays size={15} /> الحضور اليومي
          </Link>
          <Link to="/hr/payroll" className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}>
            <FileBarChart2 size={15} /> تقرير الرواتب
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
        <StatCard
          label="إجمالي الموظفين"
          value={stats.total_employees}
          icon={Users}
          colorClass="bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400"
          trend={`${stats.active_employees} نشط`}
          trendUp
        />
        <StatCard
          label="الحضور اليوم"
          value={stats.present_today}
          icon={UserCheck}
          colorClass="bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-400"
        />
        <StatCard
          label="الغياب اليوم"
          value={stats.absent_today}
          icon={UserX}
          colorClass="bg-danger-100 text-danger-600 dark:bg-danger-900/40 dark:text-danger-400"
        />
        <StatCard
          label="التأخير اليوم"
          value={stats.late_today}
          icon={Clock}
          colorClass="bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-400"
        />
        <StatCard
          label="صافي الرواتب (الشهر)"
          value={fmt.currency(payroll.totals.net_salary)}
          icon={ShieldCheck}
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
        />
        <StatCard
          label="التكلفة المتوقعة"
          value={fmt.currency(stats.salary_due_estimate)}
          icon={Wallet}
          colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2" padding="md">
          <CardHeader
            title="توزيع حالة الدوام اليوم"
            subtitle={`تاريخ التشغيل: ${stats.date}`}
            action={<Badge label={daily.is_locked ? 'اليوم معتمد' : 'اليوم مفتوح'} variant={daily.is_locked ? 'danger' : 'success'} />}
          />
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-40" stroke="var(--border-default)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }} />
                <Legend />
                <Bar dataKey="value" name="عدد الموظفين" fill="var(--color-primary-500)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card padding="md">
          <CardHeader title="تنبيهات تشغيلية" subtitle="الأولوية اليوم" />
          <CardBody className="space-y-2">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <Siren size={14} className="mt-0.5" />
              <p className="text-xs">{stats.absent_today > 0 ? `${stats.absent_today} موظف/موظفين غائب اليوم.` : 'لا يوجد غياب اليوم.'}</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              <Bell size={14} className="mt-0.5" />
              <p className="text-xs">{attendanceBreakdown.late > 0 ? `${attendanceBreakdown.late} موظف عليه تأخير اليوم.` : 'لا توجد حالات تأخير.'}</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ArrowRightLeft size={14} className="mt-0.5" />
              <p className="text-xs">
                إجمالي الإضافي الشهري: {fmt.currency(payroll.totals.overtime_pay)} + بدل جمعة: {fmt.currency(payroll.totals.friday_bonus)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader title="اتجاه الرواتب هذا الشهر" subtitle="أساسي / خصومات / إضافي / بدل جمعة / صافي" />
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }} />
                <Line dataKey="value" stroke="var(--color-primary-500)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card padding="md">
          <CardHeader title="أعلى حالات تأخير اليوم" subtitle="متابعة انضباط الدوام" />
          <CardBody className="space-y-2">
            {topLateEmployees.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>ممتاز — لا توجد حالات تأخير اليوم.</p>
            )}
            {topLateEmployees.map((e) => (
              <div key={e.employee_id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{e.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{e.employee_code}</p>
                </div>
                <Badge label={`${e.late_minutes} دقيقة`} variant="warning" />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
