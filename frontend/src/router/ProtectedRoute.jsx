import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, isSubscriptionExpired } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Role guard: redirect each role to their own home if they try a wrong section
  if (roles && !roles.includes(user?.role)) {
    const home = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={home} replace />;
  }

  // Subscription guard: factory users only
  if (
    user?.role !== 'admin' &&
    isSubscriptionExpired() &&
    location.pathname !== '/subscription-expired'
  ) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return children;
}
