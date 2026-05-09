import { useEffect, useMemo, useState } from 'react';
import { Banknote, BoxesIcon, Factory, TrendingUp, TrendingDown, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Input } from '../../design-system/components/atoms/Input';
import Button from '../../design-system/components/atoms/Button';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { StatCard } from '../../design-system/components/organisms/Card';
import { fmt, errMsg } from '../../utils/formatters';
import { getFinanceReport, updateCapital } from '../../services/reportService';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../utils/constants';

export default function FinancePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [capital, setCapital] = useState('');

  const canEditCapital = user?.role === ROLES.OWNER;

  const load = async () => {
    setLoading(true);
    try {
      const report = await getFinanceReport();
      setData(report);
      setCapital(String(report.capital_amount || 0));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'رأس المال', value: Number(data.capital_amount || 0) },
      { name: 'الإيرادات', value: Number(data.total_revenue || 0) },
      { name: 'التكاليف', value: Number(data.total_costs || 0) },
      { name: 'يومية العمال', value: Number(data.labor_daily_wages_cost || 0) },
      { name: 'صافي الربح', value: Number(data.net_profit || 0) },
      { name: 'المخزون', value: Number(data.total_inventory_value || 0) },
    ];
  }, [data]);

  const saveCapital = async () => {
    const n = parseFloat(capital);
    if (Number.isNaN(n) || n < 0) {
      toast.error('أدخل قيمة رأس مال صحيحة.');
      return;
    }
    setSaving(true);
    try {
      await updateCapital(n);
      toast.success('تم تحديث رأس المال.');
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <PageSpinner label="جار تحميل القائمة المالية..." />;

  return (
    <div className="space-y-5">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1>القائمة المالية</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            ربط تكاليف المصنع مع الإيرادات والربحية ورأس المال — صورة مالية كاملة.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-52">
            <Input
              label="رأس المال"
              type="number"
              min="0"
              step="0.01"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              disabled={!canEditCapital}
            />
          </div>
          <Button icon={Save} loading={saving} onClick={saveCapital} disabled={!canEditCapital}>
            حفظ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="رأس المال" value={fmt.currency(data.capital_amount)} icon={Banknote} colorClass="bg-indigo-100 text-indigo-600" />
        <StatCard label="إجمالي الإيرادات" value={fmt.currency(data.total_revenue)} icon={TrendingUp} colorClass="bg-emerald-100 text-emerald-600" />
        <StatCard label="إجمالي التكاليف" value={fmt.currency(data.total_costs)} icon={Factory} colorClass="bg-red-100 text-red-600" />
        <StatCard label="قيمة المخزون" value={fmt.currency(data.total_inventory_value)} icon={BoxesIcon} colorClass="bg-blue-100 text-blue-600" />
        <StatCard
          label="صافي الربح"
          value={fmt.currency(data.net_profit)}
          icon={data.net_profit >= 0 ? TrendingUp : TrendingDown}
          colorClass={data.net_profit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}
          trend={data.roi_percent == null ? 'ROI غير متاح' : `ROI ${Number(data.roi_percent).toFixed(2)}%`}
          trendUp={Number(data.net_profit) >= 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5 xl:col-span-2">
          <h3 className="mb-4">تحليل مالي شامل</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-primary-500)" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h3>الملخص التنفيذي</h3>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>صافي بعد الربح</p>
            <p className="text-lg font-bold">{fmt.currency(data.capital_after_profit)}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>تكلفة الإنتاج</p>
            <p className="text-lg font-bold">{fmt.currency(data.total_production_cost)}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>تكلفة يومية العمال</p>
            <p className="text-lg font-bold">{fmt.currency(data.labor_daily_wages_cost)}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>تكلفة البضاعة المباعة (COGS)</p>
            <p className="text-lg font-bold">{fmt.currency(data.total_cogs)}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>الربح الإجمالي</p>
            <p className="text-lg font-bold">{fmt.currency(data.gross_profit)}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
