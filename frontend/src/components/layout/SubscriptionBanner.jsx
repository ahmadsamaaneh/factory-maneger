import { AlertTriangle, Clock } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function SubscriptionBanner() {
  const user = useAuthStore((s) => s.user);
  const daysUntilExpiry = useAuthStore((s) => s.daysUntilExpiry);

  if (!user || user.role === 'admin') return null;

  const factory = user?.factory;
  if (!factory) return null;

  const days = daysUntilExpiry();

  // Only show if expiring within 14 days
  if (days === null || days > 14 || days < 0) return null;

  const isUrgent = days <= 3;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
        isUrgent
          ? 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-b border-danger-200 dark:border-danger-800'
          : 'bg-warning-50 dark:bg-warning-950/40 text-warning-700 dark:text-warning-300 border-b border-warning-200 dark:border-warning-800'
      }`}
    >
      {isUrgent ? <AlertTriangle size={15} className="shrink-0" /> : <Clock size={15} className="shrink-0" />}
      <span>
        {days === 0
          ? 'Your subscription expires today. Contact your administrator to renew.'
          : days === 1
          ? 'Your subscription expires tomorrow. Contact your administrator to renew.'
          : `Your subscription expires in ${days} days. Contact your administrator to renew.`}
      </span>
    </div>
  );
}
