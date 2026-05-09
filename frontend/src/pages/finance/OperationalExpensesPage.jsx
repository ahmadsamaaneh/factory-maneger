import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  LayoutDashboard,
  List,
  Plus,
  Printer,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { StatCard } from '../../design-system/components/organisms/Card';
import { fmt, errMsg } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';
import useAuthStore from '../../store/authStore';
import {
  createOpExpense,
  deleteOpExpense,
  downloadOpExpenseCsv,
  getOpExpenseAlerts,
  getOpExpenseDashboard,
  getOpExpenseLookupDepartments,
  getOpExpenseLookupEmployees,
  getOpExpenseReport,
  listOpExpenseBudgets,
  listOpExpenses,
  upsertOpExpenseBudget,
} from '../../services/operationalExpenseApi';

const EXPENSE_TYPES = [
  { id: 'fuel', label: 'بنزين ووقود' },
  { id: 'electricity', label: 'كهرباء' },
  { id: 'petty_meals', label: 'فطور ونثريات' },
  { id: 'other', label: 'أخرى' },
];

const ACCOUNTING = [
  { id: 'operational', label: 'مصاريف تشغيلية' },
  { id: 'administrative', label: 'مصاريف إدارية' },
  { id: 'petty', label: 'نثريات' },
];

const PAYMENTS = [
  { id: 'cash', label: 'نقدي' },
  { id: 'card', label: 'بطاقة' },
  { id: 'transfer', label: 'تحويل بنكي' },
  { id: 'check', label: 'شيك' },
];

const TYPE_LABEL = Object.fromEntries(EXPENSE_TYPES.map((x) => [x.id, x.label]));
const ACC_LABEL = Object.fromEntries(ACCOUNTING.map((x) => [x.id, x.label]));
const PAY_LABEL = Object.fromEntries(PAYMENTS.map((x) => [x.id, x.label]));

const CHART_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0891b2', '#dc2626'];

function emptyForm() {
  return {
    expense_date: new Date().toISOString().slice(0, 10),
    expense_type: 'petty_meals',
    accounting_class: 'operational',
    accounting_label: '',
    description: '',
    amount: '',
    department_id: '',
    employee_id: '',
    employee_name: '',
    payment_method: 'cash',
    status: 'complete',
    meta: {},
    fuel_mode: 'liters',
    meta_liters: '',
    meta_price_per_liter: '',
    meta_distance_km: '',
    meta_consumption: '',
    meta_prev: '',
    meta_curr: '',
    meta_kwh_price: '',
    meta_extra: '',
    meta_tax: '',
  };
}

export default function OperationalExpensesPage() {
  const { user } = useAuthStore();
  const canManage = user?.role === ROLES.OWNER || user?.role === ROLES.HR;

  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    expense_type: '',
    accounting_class: '',
    department_id: '',
    search: '',
  });
  const [reportRange, setReportRange] = useState({
    from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to_date: new Date().toISOString().slice(0, 10),
    group_by: 'expense_type',
  });
  const [reportData, setReportData] = useState(null);
  const [budgetRows, setBudgetRows] = useState([]);
  const [budgetForm, setBudgetForm] = useState({
    period_month: `${new Date().toISOString().slice(0, 7)}-01`,
    scope: 'all',
    scope_value: '',
    limit_amount: '',
    warn_percent: '80',
    notes: '',
  });
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    const [d, a] = await Promise.all([getOpExpenseDashboard(), getOpExpenseAlerts()]);
    setDash(d);
    setAlerts(a);
  }, []);

  const loadList = useCallback(async () => {
    const params = {};
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.expense_type) params.expense_type = filters.expense_type;
    if (filters.accounting_class) params.accounting_class = filters.accounting_class;
    if (filters.department_id) params.department_id = filters.department_id;
    if (filters.search) params.search = filters.search;
    const data = await listOpExpenses(params);
    setRows(data);
  }, [filters]);

  const loadLookups = useCallback(async () => {
    const [dept, emp] = await Promise.all([
      getOpExpenseLookupDepartments(),
      getOpExpenseLookupEmployees(),
    ]);
    setDepartments(dept);
    setEmployees(emp);
  }, []);

  const loadBudgets = useCallback(async () => {
    const data = await listOpExpenseBudgets({});
    setBudgetRows(data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadDashboard(), loadLookups(), loadList(), loadBudgets()]);
      } catch (e) {
        toast.error(errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadDashboard, loadLookups]);

  useEffect(() => {
    if (tab === 'list') loadList().catch((e) => toast.error(errMsg(e)));
  }, [tab, filters, loadList]);

  useEffect(() => {
    if (tab === 'budgets' && canManage) loadBudgets().catch((e) => toast.error(errMsg(e)));
  }, [tab, canManage, loadBudgets]);

  const pieData = useMemo(() => {
    if (!dash?.by_expense_type) return [];
    return Object.entries(dash.by_expense_type).map(([name, value]) => ({
      name: TYPE_LABEL[name] || name,
      value: Number(value || 0),
    }));
  }, [dash]);

  const submitExpense = async () => {
    let meta = {};
    if (form.expense_type === 'fuel') {
      if (form.fuel_mode === 'from_distance') {
        meta = {
          calculation_mode: 'from_distance',
          distance_km: parseFloat(form.meta_distance_km || 0),
          consumption_liters_per_100km: parseFloat(form.meta_consumption || 0),
          price_per_liter: parseFloat(form.meta_price_per_liter || 0),
        };
      } else {
        meta = {
          liters: parseFloat(form.meta_liters || 0),
          price_per_liter: parseFloat(form.meta_price_per_liter || 0),
        };
      }
    } else if (form.expense_type === 'electricity') {
      meta = {
        prev_reading: parseFloat(form.meta_prev || 0),
        curr_reading: parseFloat(form.meta_curr || 0),
        unit_price_kwh: parseFloat(form.meta_kwh_price || 0),
        extra_fees: parseFloat(form.meta_extra || 0),
        tax_amount: parseFloat(form.meta_tax || 0),
      };
    }

    const payload = {
      expense_date: form.expense_date,
      expense_type: form.expense_type,
      accounting_class: form.accounting_class,
      accounting_label: form.accounting_label || null,
      description: form.description || null,
      amount: form.amount === '' ? undefined : parseFloat(form.amount),
      department_id: form.department_id || null,
      employee_id: form.employee_id || null,
      employee_name: form.employee_name || null,
      payment_method: form.payment_method,
      status: form.status,
      meta,
    };

    setSaving(true);
    try {
      await createOpExpense(payload);
      toast.success('تم تسجيل المصروف.');
      setForm(emptyForm());
      await Promise.all([loadDashboard(), loadList()]);
      setTab('list');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const runReport = useCallback(async () => {
    try {
      const data = await getOpExpenseReport(reportRange);
      setReportData(data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, [reportRange]);

  useEffect(() => {
    if (tab === 'reports') runReport();
  }, [tab, runReport]);

  const saveBudget = async () => {
    if (!budgetForm.limit_amount) return toast.error('أدخل سقف الميزانية.');
    setSaving(true);
    try {
      await upsertOpExpenseBudget({
        period_month: budgetForm.period_month,
        scope: budgetForm.scope,
        scope_value: budgetForm.scope_value || null,
        limit_amount: parseFloat(budgetForm.limit_amount),
        warn_percent: parseInt(budgetForm.warn_percent || '80', 10),
        notes: budgetForm.notes || null,
      });
      toast.success('تم حفظ الميزانية.');
      await loadBudgets();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const printReport = () => {
    if (!reportData) return;
    const w = window.open('', '_blank');
    if (!w) return toast.error('تعذر فتح نافذة الطباعة.');
    const rowsHtml = (reportData.groups || [])
      .map(
        (g) =>
          `<tr><td>${g.bucket ?? '—'}</td><td>${fmt.currency(g.total)}</td></tr>`
      )
      .join('');
    w.document.write(`
      <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>تقرير مصاريف</title>
      <style>
        body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin-bottom:8px}
        table{border-collapse:collapse;width:100%;margin-top:12px}
        th,td{border:1px solid #ccc;padding:8px;text-align:right}
        th{background:#f3f4f6}
      </style></head><body>
      <h1>تقرير المصاريف التشغيلية</h1>
      <p>من ${reportRange.from_date} إلى ${reportRange.to_date} — التجميع: ${reportRange.group_by}</p>
      <p><strong>الإجمالي:</strong> ${fmt.currency(reportData.total)}</p>
      <table><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      </body></html>`);
    w.document.close();
    w.print();
  };

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'entry', label: 'تسجيل مصروف', icon: Plus },
    { id: 'list', label: 'سجل المصاريف', icon: List },
    { id: 'reports', label: 'تقارير', icon: BarChart3 },
    ...(canManage ? [{ id: 'budgets', label: 'الميزانيات', icon: Wallet }] : []),
  ];

  if (loading && !dash) return <PageSpinner label="جار تحميل المصاريف التشغيلية..." />;

  return (
    <div className="space-y-5">
      <div className="page-header flex-col sm:flex-row gap-4 items-start">
        <div>
          <h1>المصاريف التشغيلية</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            إدارة موحدة للبنزين والكهرباء والنثريات مع تقارير وميزانيات وتنبيهات — واجهة عربية متجاوبة.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2" style={{ borderColor: 'var(--border-default)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && dash && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="مصاريف اليوم"
              value={fmt.currency(dash.total_daily)}
              icon={Calendar}
              colorClass="bg-sky-100 text-sky-700"
            />
            <StatCard
              label="مصاريف الشهر الحالي"
              value={fmt.currency(dash.total_monthly)}
              icon={Banknote}
              colorClass="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              label="أعلى نوع هذا الشهر"
              value={
                dash.top_expense_types?.[0]
                  ? TYPE_LABEL[dash.top_expense_types[0].expense_type]
                  : '—'
              }
              icon={BarChart3}
              colorClass="bg-violet-100 text-violet-700"
            />
            <StatCard
              label="تنبيهات حالية"
              value={alerts.length}
              icon={AlertTriangle}
              colorClass="bg-amber-100 text-amber-800"
            />
          </div>

          {alerts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                التنبيهات
              </h2>
              <div className="grid gap-2">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 text-sm ${
                      a.severity === 'danger'
                        ? 'border-red-200 bg-red-50 dark:bg-red-950/30'
                        : 'border-amber-200 bg-amber-50 dark:bg-amber-950/25'
                    }`}
                  >
                    {a.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-4 min-h-[280px]">
              <h3 className="text-sm font-semibold mb-3">توزيع المصاريف حسب النوع (الشهر)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData.length ? pieData : [{ name: '—', value: 1 }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={78}
                    label={pieData.length ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
                  >
                    {(pieData.length ? pieData : [{ name: '—', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt.currency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-4 min-h-[280px]">
              <h3 className="text-sm font-semibold mb-3">نثريات يومية (الشهر)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dash.petty_daily_series || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => fmt.currency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'entry' && (
        <div className="card p-4 space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="تاريخ المصروف"
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium">نوع المصروف</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={form.expense_type}
                onChange={(e) => setForm((f) => ({ ...f, expense_type: e.target.value }))}
              >
                {EXPENSE_TYPES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">التصنيف المحاسبي</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={form.accounting_class}
                onChange={(e) => setForm((f) => ({ ...f, accounting_class: e.target.value }))}
              >
                {ACCOUNTING.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="التصنيف التفصيلي (اختياري)"
              value={form.accounting_label}
              onChange={(e) => setForm((f) => ({ ...f, accounting_label: e.target.value }))}
              placeholder="مثال: حساب بنزين المركبات"
            />
            <Input
              label="البيان / الوصف"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium">طريقة الدفع</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={form.payment_method}
                onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
              >
                {PAYMENTS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">القسم</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={form.department_id}
                onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">موظف مسجل</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={form.employee_id}
                onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              >
                <option value="">—</option>
                {employees.map((em) => (
                  <option key={em.id} value={em.id}>
                    {em.full_name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="اسم يدوي (إن لم يوجد في القائمة)"
              value={form.employee_name}
              onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium">حالة السجل</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="complete">مكتمل</option>
                <option value="draft">مسودة / غير مكتمل</option>
              </select>
            </div>
          </div>

          {form.expense_type === 'fuel' && (
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-sm font-semibold">حساب البنزين</p>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.fuel_mode === 'liters'}
                    onChange={() => setForm((f) => ({ ...f, fuel_mode: 'liters' }))}
                  />
                  لترات × سعر اللتر
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.fuel_mode === 'from_distance'}
                    onChange={() => setForm((f) => ({ ...f, fuel_mode: 'from_distance' }))}
                  />
                  من المسافة ومعدل الاستهلاك
                </label>
              </div>
              {form.fuel_mode === 'liters' ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="عدد اللترات"
                    type="number"
                    step="0.001"
                    value={form.meta_liters}
                    onChange={(e) => setForm((f) => ({ ...f, meta_liters: e.target.value }))}
                  />
                  <Input
                    label="سعر اللتر"
                    type="number"
                    step="0.01"
                    value={form.meta_price_per_liter}
                    onChange={(e) => setForm((f) => ({ ...f, meta_price_per_liter: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="المسافة (كم)"
                    type="number"
                    step="0.1"
                    value={form.meta_distance_km}
                    onChange={(e) => setForm((f) => ({ ...f, meta_distance_km: e.target.value }))}
                  />
                  <Input
                    label="استهلاك (لتر / 100كم)"
                    type="number"
                    step="0.1"
                    value={form.meta_consumption}
                    onChange={(e) => setForm((f) => ({ ...f, meta_consumption: e.target.value }))}
                  />
                  <Input
                    label="سعر اللتر"
                    type="number"
                    step="0.01"
                    value={form.meta_price_per_liter}
                    onChange={(e) => setForm((f) => ({ ...f, meta_price_per_liter: e.target.value }))}
                  />
                </div>
              )}
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                يُحسب المبلغ تلقائياً من اللترات × السعر، أو من المسافة والاستهلاك ثم × السعر.
              </p>
            </div>
          )}

          {form.expense_type === 'electricity' && (
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-sm font-semibold">فاتورة الكهرباء</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  label="قراءة العداد السابقة"
                  type="number"
                  step="0.001"
                  value={form.meta_prev}
                  onChange={(e) => setForm((f) => ({ ...f, meta_prev: e.target.value }))}
                />
                <Input
                  label="قراءة العداد الحالية"
                  type="number"
                  step="0.001"
                  value={form.meta_curr}
                  onChange={(e) => setForm((f) => ({ ...f, meta_curr: e.target.value }))}
                />
                <Input
                  label="سعر الكيلوواط ساعة"
                  type="number"
                  step="0.0001"
                  value={form.meta_kwh_price}
                  onChange={(e) => setForm((f) => ({ ...f, meta_kwh_price: e.target.value }))}
                />
                <Input
                  label="رسوم إضافية"
                  type="number"
                  step="0.01"
                  value={form.meta_extra}
                  onChange={(e) => setForm((f) => ({ ...f, meta_extra: e.target.value }))}
                />
                <Input
                  label="ضرائب أو رسوم ثابتة"
                  type="number"
                  step="0.01"
                  value={form.meta_tax}
                  onChange={(e) => setForm((f) => ({ ...f, meta_tax: e.target.value }))}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                المبلغ = (الفرق بين القراءات × سعر الكيلوواط) + الرسوم + الضريبة.
              </p>
            </div>
          )}

          {(form.expense_type === 'petty_meals' || form.expense_type === 'other') && (
            <Input
              label="المبلغ"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          )}

          {(form.expense_type === 'fuel' || form.expense_type === 'electricity') && (
            <Input
              label="المبلغ اليدوي (اختياري — يتجاوز الحساب التلقائي إن وُجد)"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          )}

          <Button loading={saving} icon={Plus} onClick={submitExpense}>
            حفظ المصروف
          </Button>
        </div>
      )}

      {tab === 'list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="من تاريخ"
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters((f) => ({ ...f, from_date: e.target.value }))}
            />
            <Input
              label="إلى تاريخ"
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters((f) => ({ ...f, to_date: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium">نوع المصروف</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={filters.expense_type}
                onChange={(e) => setFilters((f) => ({ ...f, expense_type: e.target.value }))}
              >
                <option value="">الكل</option>
                {EXPENSE_TYPES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">التصنيف</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={filters.accounting_class}
                onChange={(e) => setFilters((f) => ({ ...f, accounting_class: e.target.value }))}
              >
                <option value="">الكل</option>
                {ACCOUNTING.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">القسم</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={filters.department_id}
                onChange={(e) => setFilters((f) => ({ ...f, department_id: e.target.value }))}
              >
                <option value="">الكل</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="بحث في البيان"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="وصف، موظف..."
            />
          </div>

          <DataTable
            columns={[
              { key: 'expense_date', label: 'التاريخ', render: (r) => r.expense_date },
              {
                key: 'expense_type',
                label: 'النوع',
                render: (r) => TYPE_LABEL[r.expense_type] || r.expense_type,
              },
              {
                key: 'accounting_class',
                label: 'التصنيف',
                render: (r) => ACC_LABEL[r.accounting_class] || r.accounting_class,
              },
              { key: 'description', label: 'البيان', render: (r) => r.description || '—' },
              {
                key: 'amount',
                label: 'المبلغ',
                render: (r) => <span className="font-semibold">{fmt.currency(r.amount)}</span>,
              },
              {
                key: 'dept',
                label: 'القسم',
                render: (r) => r.department?.name || '—',
              },
              {
                key: 'emp',
                label: 'الموظف',
                render: (r) => r.employee?.full_name || r.employee_name || '—',
              },
              {
                key: 'pay',
                label: 'الدفع',
                render: (r) => PAY_LABEL[r.payment_method],
              },
              {
                key: 'status',
                label: 'الحالة',
                render: (r) => (r.status === 'draft' ? 'مسودة' : 'مكتمل'),
              },
              ...(canManage
                ? [
                    {
                      key: 'del',
                      label: '',
                      width: 56,
                      render: (r) => (
                        <button
                          type="button"
                          className="text-danger-600 hover:underline text-xs"
                          onClick={async () => {
                            if (!window.confirm('حذف هذا المصروف؟')) return;
                            try {
                              await deleteOpExpense(r.id);
                              toast.success('تم الحذف.');
                              await loadList();
                              await loadDashboard();
                            } catch (e) {
                              toast.error(errMsg(e));
                            }
                          }}
                        >
                          حذف
                        </button>
                      ),
                    },
                  ]
                : []),
            ]}
            data={rows}
            emptyMessage="لا توجد مصاريف مطابقة."
          />
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Input
              label="من"
              type="date"
              value={reportRange.from_date}
              onChange={(e) => setReportRange((r) => ({ ...r, from_date: e.target.value }))}
            />
            <Input
              label="إلى"
              type="date"
              value={reportRange.to_date}
              onChange={(e) => setReportRange((r) => ({ ...r, to_date: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium">تجميع</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full min-w-[160px]"
                value={reportRange.group_by}
                onChange={(e) => setReportRange((r) => ({ ...r, group_by: e.target.value }))}
              >
                <option value="expense_type">حسب نوع المصروف</option>
                <option value="accounting_class">حسب التصنيف المحاسبي</option>
                <option value="department">حسب القسم</option>
                <option value="employee">حسب الموظف</option>
                <option value="day">يومياً</option>
              </select>
            </div>
            <Button icon={BarChart3} onClick={runReport}>
              تحديث التقرير
            </Button>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={() =>
                downloadOpExpenseCsv({
                  from_date: reportRange.from_date || undefined,
                  to_date: reportRange.to_date || undefined,
                  expense_type: filters.expense_type || undefined,
                  accounting_class: filters.accounting_class || undefined,
                  department_id: filters.department_id || undefined,
                  search: filters.search || undefined,
                }).catch((e) => toast.error(errMsg(e)))
              }
            >
              Excel (CSV)
            </Button>
            <Button variant="secondary" icon={Printer} onClick={printReport}>
              طباعة / PDF
            </Button>
          </div>

          {reportData && (
            <>
              <div className="card p-4 flex flex-wrap gap-6">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    إجمالي الفترة
                  </p>
                  <p className="text-xl font-bold">{fmt.currency(reportData.total)}</p>
                </div>
              </div>
              <div className="card p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(reportData.groups || []).map((g) => ({ name: String(g.bucket ?? '—'), total: g.total }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmt.currency(v)} />
                    <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <DataTable
                columns={[
                  { key: 'bucket', label: 'البند', render: (r) => String(r.bucket ?? '—') },
                  { key: 'total', label: 'المبلغ', render: (r) => fmt.currency(r.total) },
                ]}
                data={reportData.groups || []}
                emptyMessage="لا بيانات."
              />
            </>
          )}
        </div>
      )}

      {tab === 'budgets' && canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm">ميزانية شهرية</h3>
            <Input
              label="شهر الميزانية"
              type="month"
              value={(budgetForm.period_month || '').slice(0, 7)}
              onChange={(e) =>
                setBudgetForm((b) => ({
                  ...b,
                  period_month: e.target.value ? `${e.target.value}-01` : `${new Date().toISOString().slice(0, 7)}-01`,
                }))
              }
            />
            <div>
              <label className="text-sm font-medium">نطاق الميزانية</label>
              <select
                className="ds-input h-10 text-sm mt-1 w-full"
                value={budgetForm.scope}
                onChange={(e) => setBudgetForm((b) => ({ ...b, scope: e.target.value, scope_value: '' }))}
              >
                <option value="all">إجمالي المصاريف</option>
                <option value="expense_type">نوع مصروف محدد</option>
                <option value="accounting_class">تصنيف محاسبي</option>
              </select>
            </div>
            {budgetForm.scope === 'expense_type' && (
              <select
                className="ds-input h-10 text-sm w-full"
                value={budgetForm.scope_value}
                onChange={(e) => setBudgetForm((b) => ({ ...b, scope_value: e.target.value }))}
              >
                <option value="">اختر...</option>
                {EXPENSE_TYPES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            )}
            {budgetForm.scope === 'accounting_class' && (
              <select
                className="ds-input h-10 text-sm w-full"
                value={budgetForm.scope_value}
                onChange={(e) => setBudgetForm((b) => ({ ...b, scope_value: e.target.value }))}
              >
                <option value="">اختر...</option>
                {ACCOUNTING.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            )}
            <Input
              label="سقف المبلغ"
              type="number"
              value={budgetForm.limit_amount}
              onChange={(e) => setBudgetForm((b) => ({ ...b, limit_amount: e.target.value }))}
            />
            <Input
              label="تنبيه عند نسبة من السقف %"
              type="number"
              value={budgetForm.warn_percent}
              onChange={(e) => setBudgetForm((b) => ({ ...b, warn_percent: e.target.value }))}
            />
            <Input
              label="ملاحظات"
              value={budgetForm.notes}
              onChange={(e) => setBudgetForm((b) => ({ ...b, notes: e.target.value }))}
            />
            <Button loading={saving} onClick={saveBudget}>
              حفظ الميزانية
            </Button>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-sm mb-3">الميزانيات المحفوظة</h3>
            <DataTable
              columns={[
                { key: 'period_month', label: 'الشهر', render: (r) => r.period_month },
                { key: 'scope', label: 'النطاق', render: (r) => `${r.scope} ${r.scope_value || ''}` },
                {
                  key: 'limit_amount',
                  label: 'السقف',
                  render: (r) => fmt.currency(r.limit_amount),
                },
                { key: 'warn_percent', label: 'تنبيه %', render: (r) => r.warn_percent },
              ]}
              data={budgetRows}
              emptyMessage="لا توجد ميزانيات بعد."
            />
          </div>
        </div>
      )}
    </div>
  );
}
