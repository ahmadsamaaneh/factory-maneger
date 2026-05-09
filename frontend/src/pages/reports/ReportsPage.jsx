import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BoxesIcon, Factory, ShoppingCart, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { StatCard } from '../../design-system/components/organisms/Card';
import Badge from '../../design-system/components/atoms/Badge';
import {
  getInventoryReport,
  getProductionReport,
  getSalesReport,
  getProfitReport,
  getEmployeeAttendanceReport,
  getEmployeePayrollReport,
} from '../../services/reportService';
import { fmt } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';
import { ROLES, STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState({ from: '', to: '' });
  const [tab,     setTab]     = useState('overview');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));

  const canSeeInventory  = [ROLES.ADMIN, ROLES.OWNER, ROLES.INVENTORY].includes(user?.role);
  const canSeeProduction = [ROLES.ADMIN, ROLES.OWNER, ROLES.PRODUCTION].includes(user?.role);
  const canSeeSales      = [ROLES.ADMIN, ROLES.OWNER, ROLES.SALES].includes(user?.role);
  const canSeeProfit     = [ROLES.ADMIN, ROLES.OWNER].includes(user?.role);
  const canSeeHrReports  = [ROLES.OWNER, ROLES.HR].includes(user?.role);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        canSeeInventory  ? getInventoryReport(params)  : Promise.resolve(null),
        canSeeProduction ? getProductionReport(params) : Promise.resolve(null),
        canSeeSales      ? getSalesReport(params)      : Promise.resolve(null),
        canSeeProfit     ? getProfitReport(params)     : Promise.resolve(null),
        canSeeHrReports  ? getEmployeeAttendanceReport(params.attendance_date) : Promise.resolve(null),
        canSeeHrReports  ? getEmployeePayrollReport(params.payroll_month) : Promise.resolve(null),
      ]);
      setData({
        inventory:  results[0].value,
        production: results[1].value,
        sales:      results[2].value,
        profit:     results[3].value,
        hrAttendance: results[4].value,
        hrPayroll: results[5].value,
      });
    } catch (e) {
      toast.error('فشل تحميل التقارير.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load({ attendance_date: attendanceDate, payroll_month: payrollMonth }); }, []);

  const applyFilter = () => load({
    from: range.from || undefined,
    to: range.to || undefined,
    attendance_date: attendanceDate || undefined,
    payroll_month: payrollMonth || undefined,
  });

  const tabs = [
    { id: 'overview',   label: 'نظرة عامة',   show: true },
    { id: 'inventory',  label: 'المخزون',  show: canSeeInventory },
    { id: 'production', label: 'الإنتاج', show: canSeeProduction },
    { id: 'sales',      label: 'المبيعات',      show: canSeeSales },
    { id: 'attendance', label: 'دوام الموظفين', show: canSeeHrReports },
    { id: 'payroll', label: 'رواتب الموظفين', show: canSeeHrReports },
  ].filter((t) => t.show);

  if (loading) return <PageSpinner />;

  const inventoryChartData = (data.inventory?.materials || [])
    .slice(0, 8)
    .map((m) => ({ name: m.name.length > 10 ? m.name.slice(0, 10) + '…' : m.name, qty: parseFloat(m.quantity), value: parseFloat(m.quantity) * parseFloat(m.cost_per_unit) }));

  const salesStatusData = (() => {
    const counts = {};
    (data.sales?.orders || []).forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.reports.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('pages.reports.subtitle')}</p>
        </div>
        {/* Date filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Calendar size={13} className="text-gray-400" />
            <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="text-xs border-none outline-none text-gray-600 bg-transparent" />
          </div>
          <span className="text-gray-400 text-xs">إلى</span>
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Calendar size={13} className="text-gray-400" />
            <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="text-xs border-none outline-none text-gray-600 bg-transparent" />
          </div>
          <button onClick={applyFilter} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition">تطبيق</button>
          {canSeeHrReports && (
            <>
              <span className="text-gray-400 text-xs">تاريخ الدوام</span>
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <Calendar size={13} className="text-gray-400" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="text-xs border-none outline-none text-gray-600 bg-transparent"
                />
              </div>
              <span className="text-gray-400 text-xs">شهر الرواتب</span>
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <Calendar size={13} className="text-gray-400" />
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="text-xs border-none outline-none text-gray-600 bg-transparent"
                />
              </div>
            </>
          )}
          <button onClick={() => {
            const t = new Date();
            setRange({ from: '', to: '' });
            setAttendanceDate(t.toISOString().slice(0, 10));
            setPayrollMonth(t.toISOString().slice(0, 7));
            load({
              attendance_date: t.toISOString().slice(0, 10),
              payroll_month: t.toISOString().slice(0, 7),
            });
          }} className="px-3 py-1.5 bg-white border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition">إعادة ضبط</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {data.inventory  && <StatCard label="قيمة المخزون"  value={fmt.currency(data.inventory.total_inventory_value)}  icon={BoxesIcon}     color="indigo" />}
            {data.production && <StatCard label="تكلفة الإنتاج"  value={fmt.currency(data.production.total_cost)}            icon={Factory}       color="amber"  />}
            {data.sales      && <StatCard label="إجمالي الإيراد"    value={fmt.currency(data.sales.total_revenue)}             icon={ShoppingCart}  color="blue"   />}
            {data.profit     && <StatCard label="صافي الربح"       value={fmt.currency(data.profit.net_profit)}               icon={TrendingUp}    color="green"  />}
          </div>

          {data.profit && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="mb-4">ملخص الأرباح</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'إجمالي الإيراد',    value: fmt.currency(data.profit.total_revenue),    color: 'text-gray-900' },
                  { label: 'تكلفة البضاعة',    value: fmt.currency(data.profit.total_cogs),        color: 'text-red-600' },
                  { label: 'الربح الإجمالي',     value: fmt.currency(data.profit.gross_profit),      color: 'text-green-600' },
                  { label: 'الهامش الإجمالي',     value: fmt.percent(data.profit.gross_margin_percent), color: 'text-indigo-600' },
                  { label: 'تكلفة الإنتاج',  value: fmt.currency(data.profit.total_production_cost), color: 'text-amber-600' },
                  { label: 'صافي الربح',       value: fmt.currency(data.profit.net_profit),        color: 'text-green-700' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INVENTORY ── */}
      {tab === 'inventory' && data.inventory && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="إجمالي المواد"   value={data.inventory.total_materials}                          icon={BoxesIcon}     color="indigo" />
            <StatCard label="قيمة المخزون"   value={fmt.currency(data.inventory.total_inventory_value)}      icon={TrendingUp}    color="green"  />
            <StatCard label="منخفض المخزون"   value={data.inventory.low_stock_count}                          icon={AlertTriangle} color="red"    />
          </div>

          {inventoryChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="mb-4">مستويات المخزون</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={inventoryChartData} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="qty" fill="#6366f1" radius={[4, 4, 0, 0]} name="الكمية" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.inventory.low_stock_items?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="mb-3 flex items-center gap-2 text-amber-700">
                <AlertTriangle size={16} /> تنبيه انخفاض المخزون
              </h3>
              <div className="space-y-2">
                {data.inventory.low_stock_items.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">حد إعادة الطلب: {fmt.number(m.reorder_level, 0)} {m.unit_type}</span>
                      <span className="text-sm font-semibold text-red-600">{fmt.number(m.quantity, 2)} {m.unit_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTION ── */}
      {tab === 'production' && data.production && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="إجمالي الدفعات"      value={data.production.total_batches}                         icon={Factory}    color="indigo" />
            <StatCard label="تكلفة المواد"     value={fmt.currency(data.production.total_raw_materials_cost)} icon={BoxesIcon}  color="amber"  />
            <StatCard label="إجمالي المصروف"        value={fmt.currency(data.production.total_cost)}              icon={TrendingUp} color="red"    />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3>سجل الإنتاج</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Batch #', 'Recipe', '× Qty', 'Materials', 'Overhead', 'Total', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.production.batches.slice(0, 15).map((b) => (
                  <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-mono text-xs">{b.batch_number}</td>
                    <td className="px-4 py-3">{b.recipe?.name || '—'}</td>
                    <td className="px-4 py-3">×{b.quantity_multiplier}</td>
                    <td className="px-4 py-3">{fmt.currency(b.raw_materials_cost)}</td>
                    <td className="px-4 py-3">{fmt.currency(b.production_cost)}</td>
                    <td className="px-4 py-3 font-semibold">{fmt.currency(b.total_cost)}</td>
                    <td className="px-4 py-3 text-gray-400">{fmt.date(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SALES ── */}
      {tab === 'sales' && data.sales && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Total Orders"  value={data.sales.total_orders}                icon={ShoppingCart} color="blue"  />
            <StatCard label="Total Revenue" value={fmt.currency(data.sales.total_revenue)} icon={TrendingUp}   color="green" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {salesStatusData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="mb-4">Orders by Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={salesStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                      {salesStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3>Recent Orders</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {data.sales.orders.slice(0, 8).map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{o.customer?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{o.order_number} · {fmt.date(o.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge label={o.status} className={STATUS_COLORS[o.status]} />
                      <span className="text-sm font-semibold text-gray-900">{fmt.currency(o.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EMPLOYEE ATTENDANCE ── */}
      {tab === 'attendance' && data.hrAttendance && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard
              label="حاضرين"
              value={data.hrAttendance.items.filter((r) => ['present', 'late', 'half_day'].includes(r.status)).length}
              icon={ShoppingCart}
              color="green"
            />
            <StatCard
              label="غائبين"
              value={data.hrAttendance.items.filter((r) => r.status === 'absent').length}
              icon={AlertTriangle}
              color="red"
            />
            <StatCard
              label="إجازة مرضية"
              value={data.hrAttendance.items.filter((r) => r.status === 'sick_leave').length}
              icon={Calendar}
              color="amber"
            />
            <StatCard
              label="اليوم"
              value={fmt.date(data.hrAttendance.work_date)}
              icon={Calendar}
              color="indigo"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3>تقرير دوام الموظفين</h3>
              <Badge
                label={data.hrAttendance.is_locked ? 'اليوم معتمد (مقفل)' : 'اليوم مفتوح'}
                variant={data.hrAttendance.is_locked ? 'danger' : 'success'}
              />
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['الموظف', 'القسم', 'الحالة', 'تأخير (دقيقة)', 'إضافي (دقيقة)', 'خصم', 'إضافي (مالي)'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.hrAttendance.items.map((r) => (
                  <tr key={r.employee_id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium">{r.full_name}</td>
                    <td className="px-4 py-3">{r.department?.name || '—'}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.late_minutes}</td>
                    <td className="px-4 py-3">{r.overtime_minutes}</td>
                    <td className="px-4 py-3 text-red-600">{fmt.currency(r.deduction_amount || 0)}</td>
                    <td className="px-4 py-3 text-green-700">{fmt.currency(r.overtime_amount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EMPLOYEE PAYROLL ── */}
      {tab === 'payroll' && data.hrPayroll && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <StatCard label="إجمالي الأساسي" value={fmt.currency(data.hrPayroll.totals.base_salary)} icon={TrendingUp} color="indigo" />
            <StatCard label="إجمالي الخصومات" value={fmt.currency(data.hrPayroll.totals.deductions)} icon={AlertTriangle} color="red" />
            <StatCard label="إجمالي الإضافي" value={fmt.currency(data.hrPayroll.totals.overtime_pay)} icon={Factory} color="green" />
            <StatCard label="بدل دوام الجمعة" value={fmt.currency(data.hrPayroll.totals.friday_bonus)} icon={Calendar} color="blue" />
            <StatCard label="صافي الرواتب" value={fmt.currency(data.hrPayroll.totals.net_salary)} icon={ShoppingCart} color="blue" />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3>تقرير رواتب الموظفين - {data.hrPayroll.month}</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['الموظف', 'القسم', 'الأساسي', 'أيام حضور', 'أيام غياب', 'دقائق تأخير', 'دقائق إضافي', 'خصومات', 'إضافي', 'بدل الجمعة', 'الصافي'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.hrPayroll.items.map((r) => (
                  <tr key={r.employee_id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium">{r.full_name}</td>
                    <td className="px-4 py-3">{r.department?.name || '—'}</td>
                    <td className="px-4 py-3">{fmt.currency(r.base_salary)}</td>
                    <td className="px-4 py-3">{r.attendance_days}</td>
                    <td className="px-4 py-3">{r.absent_days}</td>
                    <td className="px-4 py-3">{r.late_minutes}</td>
                    <td className="px-4 py-3">{r.overtime_minutes}</td>
                    <td className="px-4 py-3 text-red-600">{fmt.currency(r.deductions)}</td>
                    <td className="px-4 py-3 text-green-700">{fmt.currency(r.overtime_pay)}</td>
                    <td className="px-4 py-3 text-indigo-700">{fmt.currency(r.friday_bonus)}</td>
                    <td className="px-4 py-3 font-semibold">{fmt.currency(r.net_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
