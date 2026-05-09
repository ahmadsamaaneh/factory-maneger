import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import useAuthStore from '../store/authStore';

import LoginPage               from '../pages/auth/LoginPage';
import InventoryPage           from '../pages/inventory/InventoryPage';
import ProductsPage            from '../pages/products/ProductsPage';
import RecipesPage             from '../pages/production/RecipesPage';
import BatchesPage             from '../pages/production/BatchesPage';
import CustomersPage           from '../pages/sales/CustomersPage';
import OrdersPage              from '../pages/sales/OrdersPage';
import ReportsPage             from '../pages/reports/ReportsPage';
import UsersPage               from '../pages/users/UsersPage';
import HrDashboardPage         from '../pages/hr/HrDashboardPage';
import HrEmployeesPage         from '../pages/hr/HrEmployeesPage';
import EmployeeDetailPage      from '../pages/hr/EmployeeDetailPage';
import HrAttendancePage        from '../pages/hr/HrAttendancePage';
import HrPayrollReportPage     from '../pages/hr/HrPayrollReportPage';
import FinancePage             from '../pages/finance/FinancePage';
import OperationalExpensesPage from '../pages/finance/OperationalExpensesPage';
import CashVanDashboardPage    from '../pages/cash-van/CashVanDashboardPage';
import CashVanLoadingPage      from '../pages/cash-van/CashVanLoadingPage';
import CashVanSalesPosPage     from '../pages/cash-van/CashVanSalesPosPage';
import CashVanReconciliationPage from '../pages/cash-van/CashVanReconciliationPage';
import AdminDashboardPage      from '../pages/admin/AdminDashboardPage';
import AdminUsersPage          from '../pages/admin/AdminUsersPage';
import FactoriesPage           from '../pages/admin/FactoriesPage';
import FactoryDetailPage       from '../pages/admin/FactoryDetailPage';
import SubscriptionExpiredPage from '../pages/SubscriptionExpiredPage';
import AccountSettingsPage       from '../pages/settings/AccountSettingsPage';

const FACTORY_ROLES = ['factory_owner', 'hr_manager', 'inventory_manager', 'production_manager', 'sales_manager'];
const FINANCE_EXPENSE_ROLES = FACTORY_ROLES;

// Redirects to the correct home based on role
function RoleHome() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'factory_owner' || user.role === 'hr_manager') return <Navigate to="/hr" replace />;
  if (user.role === 'inventory_manager') return <Navigate to="/inventory" replace />;
  if (user.role === 'production_manager') return <Navigate to="/production/recipes" replace />;
  if (user.role === 'sales_manager') return <Navigate to="/sales/orders" replace />;
  return <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/subscription-expired', element: <SubscriptionExpiredPage /> },

  // ── Admin routes (admin role only) ────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['admin']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,             element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard',       element: <AdminDashboardPage /> },
      { path: 'factories',       element: <FactoriesPage /> },
      { path: 'factories/:id',   element: <FactoryDetailPage /> },
      { path: 'users',           element: <AdminUsersPage /> },
      { path: 'settings/account', element: <AccountSettingsPage /> },
    ],
  },

  // ── Factory user routes (admin blocked) ───────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute roles={FACTORY_ROLES}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                  element: <RoleHome /> },
      { path: 'inventory',            element: <InventoryPage /> },
      { path: 'products',             element: <ProductsPage /> },
      { path: 'production/recipes',   element: <RecipesPage /> },
      { path: 'production/batches',   element: <BatchesPage /> },
      { path: 'sales/customers',      element: <CustomersPage /> },
      { path: 'sales/orders',         element: <OrdersPage /> },
      { path: 'reports',              element: <ReportsPage /> },
      { path: 'hr',                   element: <HrDashboardPage /> },
      { path: 'hr/employees',         element: <HrEmployeesPage /> },
      { path: 'hr/employees/:id',     element: <EmployeeDetailPage /> },
      { path: 'hr/attendance',        element: <HrAttendancePage /> },
      { path: 'hr/payroll',           element: <HrPayrollReportPage /> },
      {
        path: 'cash-van/dashboard',
        element: (
          <ProtectedRoute roles={['factory_owner', 'sales_manager', 'inventory_manager', 'hr_manager']}>
            <CashVanDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cash-van/loading',
        element: (
          <ProtectedRoute roles={['factory_owner', 'inventory_manager', 'sales_manager']}>
            <CashVanLoadingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cash-van/pos',
        element: (
          <ProtectedRoute roles={['factory_owner', 'sales_manager']}>
            <CashVanSalesPosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cash-van/reconciliation',
        element: (
          <ProtectedRoute roles={['factory_owner', 'sales_manager', 'inventory_manager', 'hr_manager']}>
            <CashVanReconciliationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'finance',
        element: (
          <ProtectedRoute roles={['factory_owner', 'hr_manager']}>
            <FinancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'finance/expenses',
        element: (
          <ProtectedRoute roles={FINANCE_EXPENSE_ROLES}>
            <OperationalExpensesPage />
          </ProtectedRoute>
        ),
      },
      { path: 'users',                element: <UsersPage /> },
      { path: 'settings/account',     element: <AccountSettingsPage /> },
    ],
  },

  // ── Catch-all: redirect to role home ──────────────────────────
  { path: '*', element: <RoleHome /> },
]);
