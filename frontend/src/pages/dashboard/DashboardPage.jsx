import { useEffect, useState } from 'react';
import { Package, BoxesIcon, ShoppingCart, TrendingUp, AlertTriangle, Factory } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { StatCard } from '../../design-system/components/organisms/Card';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { getInventoryReport, getSalesReport, getProductionReport, getProfitReport } from '../../services/reportService';
import { fmt } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../utils/constants';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canSeeInventory = [ROLES.OWNER, ROLES.INVENTORY, ROLES.PRODUCTION].includes(user?.role);
    const canSeeSales = [ROLES.OWNER, ROLES.SALES].includes(user?.role);
    const canSeeProduction = [ROLES.OWNER, ROLES.PRODUCTION].includes(user?.role);
    const canSeeProfit = user?.role === ROLES.OWNER;

    Promise.allSettled([
      canSeeInventory  ? getInventoryReport()  : Promise.resolve(null),
      canSeeSales      ? getSalesReport()       : Promise.resolve(null),
      canSeeProduction ? getProductionReport()  : Promise.resolve(null),
      canSeeProfit     ? getProfitReport()      : Promise.resolve(null),
    ]).then(([inv, sales, prod, profit]) => {
      setData({
        inventory:  inv.value,
        sales:      sales.value,
        production: prod.value,
        profit:     profit.value,
      });
      setLoading(false);
    });
  }, [user]);

  if (loading) return <PageSpinner />;

  const topMaterials = (data?.inventory?.materials || []).slice(0, 6).map((m) => ({
    name: m.name.length > 12 ? m.name.slice(0, 12) + '…' : m.name,
    value: parseFloat(m.quantity),
  }));

  const salesOrders = (data?.sales?.orders || []).slice(0, 7).map((o, i) => ({
    name: `#${i + 1}`,
    amount: parseFloat(o.total_amount),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1>{t('pages.dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('auth.welcomeBack', { name: user?.name })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {data?.inventory && (
          <StatCard
            label="Inventory Items"
            value={data.inventory.total_materials}
            icon={BoxesIcon}
            colorClass="bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400"
            trend={`${data.inventory.low_stock_count} low stock`}
            trendUp={data.inventory.low_stock_count === 0}
          />
        )}
        {data?.inventory && (
          <StatCard
            label="Inventory Value"
            value={fmt.currency(data.inventory.total_inventory_value)}
            icon={TrendingUp}
            colorClass="bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-400"
          />
        )}
        {data?.sales && (
          <StatCard
            label="Total Orders"
            value={data.sales.total_orders}
            icon={ShoppingCart}
            colorClass="bg-info-100 text-info-600 dark:bg-info-900/40 dark:text-info-400"
            trend={`${fmt.currency(data.sales.total_revenue)} revenue`}
            trendUp
          />
        )}
        {data?.production && (
          <StatCard
            label="Production Batches"
            value={data.production.total_batches}
            icon={Factory}
            colorClass="bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-400"
            trend={`${fmt.currency(data.production.total_cost)} cost`}
          />
        )}
      </div>

      {/* Profit summary */}
      {data?.profit && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: fmt.currency(data.profit.total_revenue), color: 'text-green-600' },
            { label: 'Gross Profit',  value: fmt.currency(data.profit.gross_profit),  color: 'text-indigo-600' },
            { label: 'Net Profit',    value: fmt.currency(data.profit.net_profit),     color: 'text-blue-600' },
          ].map((item) => (
            <div key={item.label} className="card p-5 text-center">
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {topMaterials.length > 0 && (
          <div className="card p-5">
            <h3 className="mb-4">Inventory Levels</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMaterials} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Quantity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {salesOrders.length > 0 && (
          <div className="card p-5">
            <h3 className="mb-4">Recent Sales</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v) => [fmt.currency(v), 'Amount']}
                />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Low stock alert */}
      {data?.inventory?.low_stock_items?.length > 0 && (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-warning-800 dark:text-warning-200">
              Low Stock Alert ({data.inventory.low_stock_items.length} items)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.inventory.low_stock_items.map((m) => (
              <span key={m.id} className="px-2.5 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded-lg text-xs font-medium">
                {m.name} — {fmt.number(m.quantity, 1)} {m.unit_type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
