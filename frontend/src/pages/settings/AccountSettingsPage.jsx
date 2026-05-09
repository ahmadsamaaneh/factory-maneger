import { useEffect, useState } from 'react';
import { Eye, EyeOff, Factory, Mail, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../utils/constants';
import { errMsg } from '../../utils/formatters';
import { changePassword, updateProfileEmail, updateMyFactoryName } from '../../services/authService';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import Card, { CardBody, CardHeader } from '../../design-system/components/organisms/Card';

function PasswordToggleInput({ label, value, onChange, autoComplete, show, onToggle, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full rounded-lg border px-3 py-2 pe-10 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500"
          style={{
            borderColor: error ? 'var(--danger-fg, #dc2626)' : 'var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 rounded"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const [savingEmail, setSavingEmail] = useState(false);
  const [savingFactory, setSavingFactory] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isOwner = user?.role === ROLES.OWNER;

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setFactoryName(user.factory?.name || '');
  }, [user]);

  const refreshUser = (payload) => {
    setUser(payload);
  };

  const saveEmail = async () => {
    if (!email.trim()) {
      toast.error(t('auth.emailRequired'));
      return;
    }
    setSavingEmail(true);
    try {
      const updated = await updateProfileEmail(email.trim());
      refreshUser(updated);
      toast.success(t('pages.accountSettings.emailUpdated'));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSavingEmail(false);
    }
  };

  const saveFactory = async () => {
    const name = factoryName.trim();
    if (!name) {
      toast.error(t('pages.accountSettings.factoryName'));
      return;
    }
    setSavingFactory(true);
    try {
      const updated = await updateMyFactoryName(name);
      refreshUser(updated);
      toast.success(t('pages.accountSettings.factoryUpdated'));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSavingFactory(false);
    }
  };

  const savePassword = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      toast.error(t('auth.passwordRequired'));
      return;
    }
    if (pw.next.length < 8) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error(t('pages.accountSettings.passwordMismatch'));
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      toast.success(t('pages.accountSettings.passwordUpdated'));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  if (isAdmin) {
    return (
      <div className="max-w-2xl space-y-4">
        <div>
          <h1>{t('pages.accountSettings.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {t('pages.accountSettings.subtitle')}
          </p>
        </div>
        <Card padding="md" className="border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardBody>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('pages.accountSettings.adminNotice')}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1>{t('pages.accountSettings.title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {t('pages.accountSettings.subtitle')}
        </p>
      </div>

      <Card padding="none" className="overflow-hidden">
        <CardHeader title={t('pages.accountSettings.emailSection')} className="px-5 pt-5" />
        <CardBody className="space-y-4 px-5 pb-5">
          <Input
            label={t('common.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Button loading={savingEmail} onClick={saveEmail} icon={Mail}>
            {t('common.saveChanges')}
          </Button>
        </CardBody>
      </Card>

      {isOwner && (
        <Card padding="none" className="overflow-hidden">
          <CardHeader
            title={t('pages.accountSettings.factorySection')}
            subtitle={t('pages.accountSettings.factoryNameHint')}
            className="px-5 pt-5"
          />
          <CardBody className="space-y-4 px-5 pb-5">
            <Input
              label={t('pages.accountSettings.factoryName')}
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              autoComplete="organization"
            />
            <Button loading={savingFactory} onClick={saveFactory} icon={Factory}>
              {t('common.saveChanges')}
            </Button>
          </CardBody>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <CardHeader
          title={t('pages.accountSettings.passwordSection')}
          className="px-5 pt-5"
        />
        <CardBody className="space-y-4 px-5 pb-5">
          <PasswordToggleInput
            label={t('pages.accountSettings.currentPassword')}
            value={pw.current}
            onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            autoComplete="current-password"
            show={show.current}
            onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
          />
          <PasswordToggleInput
            label={t('pages.accountSettings.newPassword')}
            value={pw.next}
            onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
            autoComplete="new-password"
            show={show.next}
            onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
          />
          <PasswordToggleInput
            label={t('pages.accountSettings.confirmPassword')}
            value={pw.confirm}
            onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            autoComplete="new-password"
            show={show.confirm}
            onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
          />
          <Button loading={savingPw} onClick={savePassword} icon={KeyRound}>
            {t('common.saveChanges')}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
