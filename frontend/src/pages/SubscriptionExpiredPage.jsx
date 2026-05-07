import { ShieldOff, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import Button from '../design-system/components/atoms/Button';
import { fmt } from '../utils/formatters';

export default function SubscriptionExpiredPage() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const factory = user?.factory;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="card max-w-md w-full text-center p-10 space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-danger-100 dark:bg-danger-900/30">
            <ShieldOff size={32} className="text-danger-600 dark:text-danger-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('subscription.expired')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {factory?.name
              ? `${t('subscription.factory')}: ${factory.name}`
              : t('subscription.expiredMessage')}
          </p>
          {factory?.subscription_end_date && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {t('subscription.endDate')}: {fmt.date(factory.subscription_end_date)}
            </p>
          )}
        </div>

        <div className="rounded-lg p-4 text-sm space-y-1" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('subscription.expiredMessage')}
          </p>
        </div>

        <Button
          variant="outline"
          icon={LogOut}
          fullWidth
          onClick={logout}
        >
          {t('common.signOut')}
        </Button>
      </div>
    </div>
  );
}
