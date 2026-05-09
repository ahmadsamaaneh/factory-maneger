import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, FlaskConical, ShoppingCart, BarChart3,
  Users, BoxesIcon, Factory, Building2, ChevronRight, Banknote,
  PanelLeftClose, PanelLeft, ShieldCheck, UserCircle2, Truck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../utils/constants';
import Tooltip from '../../design-system/components/molecules/Tooltip';

// ── Admin-only navigation ────────────────────────────────────────
// `key` references a key under the `nav` translation namespace.
const ADMIN_NAV = [
  { key: 'dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { key: 'factories', icon: Building2,       to: '/admin/factories' },
  { key: 'users',     icon: Users,           to: '/admin/users' },
];

// ── Factory-user navigation (role-filtered) ─────────────────────
const FACTORY_NAV = [
  {
    key: 'inventory', icon: BoxesIcon, to: '/inventory',
    roles: [ROLES.OWNER, ROLES.INVENTORY, ROLES.PRODUCTION],
  },
  {
    key: 'products', icon: Package, to: '/products',
    roles: [ROLES.OWNER, ROLES.PRODUCTION, ROLES.SALES, ROLES.INVENTORY],
  },
  {
    key: 'production', icon: Factory, to: '/production',
    roles: [ROLES.OWNER, ROLES.PRODUCTION],
    children: [
      { key: 'recipes', to: '/production/recipes' },
      { key: 'batches', to: '/production/batches' },
    ],
  },
  {
    key: 'sales', icon: ShoppingCart, to: '/sales',
    roles: [ROLES.OWNER, ROLES.SALES],
    children: [
      { key: 'customers', to: '/sales/customers' },
      { key: 'orders',    to: '/sales/orders'    },
    ],
  },
  {
    key: 'reports', icon: BarChart3, to: '/reports',
    roles: [ROLES.OWNER, ROLES.INVENTORY, ROLES.PRODUCTION, ROLES.SALES],
  },
  {
    key: 'finance',
    icon: Banknote,
    to: '/finance',
    roles: [ROLES.OWNER, ROLES.HR, ROLES.INVENTORY, ROLES.PRODUCTION, ROLES.SALES],
    children: [
      { key: 'financeOverview', to: '/finance' },
      { key: 'operationalExpenses', to: '/finance/expenses' },
    ],
  },
  {
    key: 'cashVan', icon: Truck, to: '/cash-van',
    roles: [ROLES.OWNER, ROLES.SALES, ROLES.INVENTORY, ROLES.HR],
    children: [
      { key: 'cashVanDashboard', to: '/cash-van/dashboard' },
      { key: 'cashVanLoading', to: '/cash-van/loading' },
      { key: 'cashVanPos', to: '/cash-van/pos' },
      { key: 'cashVanReconciliation', to: '/cash-van/reconciliation' },
    ],
  },
  {
    key: 'hr', icon: UserCircle2, to: '/hr',
    roles: [ROLES.OWNER, ROLES.HR],
    children: [
      { key: 'hrOverview', to: '/hr' },
      { key: 'hrStaff', to: '/hr/employees' },
      { key: 'hrAttendance', to: '/hr/attendance' },
      { key: 'hrPayroll', to: '/hr/payroll' },
    ],
  },
  {
    key: 'users', icon: Users, to: '/users',
    roles: [ROLES.OWNER],
  },
];

// ── Reusable NavLink renderers ───────────────────────────────────
function SimpleLink({ to, icon: Icon, label, collapsed }) {
  if (collapsed) {
    return (
      <Tooltip content={label} side="right">
        <NavLink
          to={to}
          className={({ isActive }) => `sidebar-link justify-center px-2 ${isActive ? 'active' : ''}`}
        >
          <Icon size={17} />
        </NavLink>
      </Tooltip>
    );
  }
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

function GroupLink({ item, collapsed, t }) {
  const label = t(`nav.${item.key}`);
  if (collapsed) {
    return (
      <Tooltip content={label} side="right">
        <div className="sidebar-link justify-center px-2">
          <item.icon size={17} />
        </div>
      </Tooltip>
    );
  }
  return (
    <div>
      <p
        className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-widest mt-4 mb-1 flex items-center gap-2"
        style={{ color: 'var(--sidebar-text)' }}
      >
        <item.icon size={12} />
        {label}
      </p>
      <div className="ml-2 space-y-0.5">
        {item.children.map((child) => (
          <NavLink
            key={child.to}
            to={child.to}
            className={({ isActive }) => `sidebar-link text-xs pl-4 ${isActive ? 'active' : ''}`}
          >
            <ChevronRight size={11} className="rtl-flip" />
            {t(`nav.${child.key}`)}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ── Admin sidebar nav ────────────────────────────────────────────
function AdminNavSection({ collapsed }) {
  const { t } = useTranslation();
  return (
    <>
      {!collapsed && (
        <p
          className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <ShieldCheck size={12} />
          {t('nav.admin')}
        </p>
      )}
      {ADMIN_NAV.map((item) => (
        <SimpleLink key={item.to} to={item.to} icon={item.icon} label={t(`nav.${item.key}`)} collapsed={collapsed} />
      ))}
    </>
  );
}

// ── Factory user sidebar nav ─────────────────────────────────────
function FactoryNavSection({ collapsed }) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const role = user?.role;

  return (
    <>
      {FACTORY_NAV.map((item) => {
        if (!item.roles.includes(role)) return null;
        return item.children
          ? <GroupLink key={item.to} item={item} collapsed={collapsed} t={t} />
          : <SimpleLink key={item.to} to={item.to} icon={item.icon} label={t(`nav.${item.key}`)} collapsed={collapsed} />;
      })}
    </>
  );
}

// ── Factory badge (shows factory name + subscription status) ─────
function FactoryBadge({ collapsed }) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const factory = user?.factory;
  if (!factory || collapsed) return null;

  const isOk = factory.subscription_status === 'active' || factory.subscription_status === 'trial';
  return (
    <div className="mt-4 mx-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
      <p className="text-2xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--sidebar-text)' }}>
        {t('nav.factory')}
      </p>
      <p className="text-xs font-medium text-white truncate">{factory.name}</p>
      <p className={`text-2xs mt-0.5 ${isOk ? 'text-success-400' : 'text-danger-400'}`}>
        {t(`subscription.${factory.subscription_status}`, {
          defaultValue: factory.subscription_status.charAt(0).toUpperCase() + factory.subscription_status.slice(1),
        })}
      </p>
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <aside
      className="shrink-0 flex flex-col min-h-screen transition-all duration-300 ease-out scrollbar-thin overflow-y-auto"
      style={{ width: collapsed ? '64px' : '232px', backgroundColor: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
              <FlaskConical size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{t('auth.factoryErp')}</p>
              <p className="text-2xs truncate" style={{ color: 'var(--sidebar-text)' }}>
                {isAdmin ? t('nav.admin') : t('nav.managementSystem')}
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center mx-auto">
            <FlaskConical size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {isAdmin
          ? <AdminNavSection collapsed={collapsed} />
          : (
            <>
              <FactoryNavSection collapsed={collapsed} />
              <FactoryBadge collapsed={collapsed} />
            </>
          )
        }
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-3 border-t border-white/10 shrink-0">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg transition-colors text-xs font-medium"
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {collapsed
            ? <PanelLeft size={15} className="rtl-flip" />
            : <><PanelLeftClose size={15} className="rtl-flip" /><span>{t('nav.collapse')}</span></>}
        </button>
      </div>
    </aside>
  );
}
