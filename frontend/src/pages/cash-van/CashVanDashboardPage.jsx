import { useEffect, useMemo, useState } from 'react';
import { BarChart3, DollarSign, ReceiptText, Truck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { StatCard } from '../../design-system/components/organisms/Card';
import {
  getCashVanReconciliations,
  getCashVanSales,
  getCashVanVehicles,
} from '../../services/cashVanService';
import { errMsg, fmt } from '../../utils/formatters';

function sameDay(dateValue, dayStr) {
  if (!dateValue) return false;
  return String(dateValue).slice(0, 10) === dayStr;
}

export default function CashVanDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [salesData, recData, vehiclesData] = await Promise.all([
          getCashVanSales(),
          getCashVanReconciliations(),
          getCashVanVehicles(),
        ]);
        setSales(salesData);
        setReconciliations(recData);
        setVehicles(vehiclesData);
      } catch (e) {
        toast.error(errMsg(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todaySales = useMemo(() => sales.filter((s) => sameDay(s.issued_at, today)), [sales, today]);
  const todayReconciliations = useMemo(
    () => reconciliations.filter((r) => sameDay(r.business_date, today)),
    [reconciliations, today]
  );

  const todaySalesTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
  const todayCollections = todaySales.reduce(
    (sum, s) => sum + (s.payments || []).reduce((x, p) => x + parseFloat(p.amount || 0), 0),
    0
  );
  const todayVariance = todayReconciliations.reduce(
    (sum, r) => sum + parseFloat(r.variance_value || 0),
    0
  );

  const topVehicles = useMemo(() => {
    const map = new Map();
    for (const s of todaySales) {
      const key = s.vehicle_id;
      if (!map.has(key)) {
        map.set(key, {
          vehicle_id: key,
          vehicle: `${s.vehicle?.code || '-'} / ${s.vehicle?.plate_number || '-'}`,
          total_sales: 0,
          invoices: 0,
        });
      }
      const row = map.get(key);
      row.total_sales += parseFloat(s.total_amount || 0);
      row.invoices += 1;
    }
    return [...map.values()].sort((a, b) => b.total_sales - a.total_sales).slice(0, 5);
  }, [todaySales]);

  if (loading) return <PageSpinner label="جار تحميل Dashboard الكاش فان..." />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>Dashboard الكاش فان</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            متابعة مبيعات اليوم، التحصيلات، العجز/الزيادة، وأداء أعلى السيارات.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="مبيعات اليوم" value={fmt.currency(todaySalesTotal)} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-600" />
        <StatCard label="تحصيل اليوم" value={fmt.currency(todayCollections)} icon={ReceiptText} colorClass="bg-blue-100 text-blue-600" />
        <StatCard label="فروقات جرد اليوم" value={fmt.currency(todayVariance)} icon={BarChart3} colorClass="bg-amber-100 text-amber-600" />
        <StatCard label="عدد السيارات" value={vehicles.length} icon={Truck} colorClass="bg-indigo-100 text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5 xl:col-span-2">
          <h3 className="mb-4">أفضل السيارات اليوم</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVehicles}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="vehicle" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <Tooltip />
                <Bar dataKey="total_sales" fill="var(--color-primary-500)" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3">ملخص اليوم</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>عدد الفواتير اليوم</p>
              <p className="text-lg font-bold">{todaySales.length}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>اليوميات المقفلة اليوم</p>
              <p className="text-lg font-bold">{todayReconciliations.filter((r) => r.status === 'closed').length}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>مبيعات آجلة اليوم</p>
              <p className="text-lg font-bold">{todaySales.filter((s) => s.sale_type === 'credit').length}</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'vehicle', label: 'السيارة' },
          { key: 'invoices', label: 'عدد الفواتير' },
          { key: 'total_sales', label: 'إجمالي المبيعات', render: (r) => <span className="font-semibold">{fmt.currency(r.total_sales)}</span> },
        ]}
        data={topVehicles}
        emptyMessage="لا توجد بيانات مبيعات اليوم."
      />
    </div>
  );
}
