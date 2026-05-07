import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import useAuthStore from '../store/authStore';

import LoginPage               from '../pages/auth/LoginPage';
import DashboardPage           from '../pages/dashboard/DashboardPage';
import InventoryPage           from '../pages/inventory/InventoryPage';
import ProductsPage            from '../pages/products/ProductsPage';
import RecipesPage             from '../pages/production/RecipesPage';
import BatchesPage             from '../pages/production/BatchesPage';
import CustomersPage           from '../pages/sales/CustomersPage';
import OrdersPage              from '../pages/sales/OrdersPage';
import ReportsPage             from '../pages/reports/ReportsPage';
import UsersPage               from '../pages/users/UsersPage';
import AdminDashboardPage      from '../pages/admin/AdminDashboardPage';
import AdminUsersPage          from '../pages/admin/AdminUsersPage';
import FactoriesPage           from '../pages/admin/FactoriesPage';
import FactoryDetailPage       from '../pages/admin/FactoryDetailPage';
import SubscriptionExpiredPage from '../pages/SubscriptionExpiredPage';

const FACTORY_ROLES = ['factory_owner', 'inventory_manager', 'production_manager', 'sales_manager'];

// Redirects to the correct home based on role
function RoleHome() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin'
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/dashboard" replace />;
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
      { index: true,                  element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',            element: <DashboardPage /> },
      { path: 'inventory',            element: <InventoryPage /> },
      { path: 'products',             element: <ProductsPage /> },
      { path: 'production/recipes',   element: <RecipesPage /> },
      { path: 'production/batches',   element: <BatchesPage /> },
      { path: 'sales/customers',      element: <CustomersPage /> },
      { path: 'sales/orders',         element: <OrdersPage /> },
      { path: 'reports',              element: <ReportsPage /> },
      { path: 'users',                element: <UsersPage /> },
    ],
  },

  // ── Catch-all: redirect to role home ──────────────────────────
  { path: '*', element: <RoleHome /> },
]);
