import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, ChevronDown, Sun, Moon, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { fmt } from '../../utils/formatters';
import { useTheme } from '../../design-system/hooks/useTheme.jsx';
import { Dropdown, DropdownItem, DropdownSeparator } from '../../design-system/components/molecules/Dropdown';
import Tooltip from '../../design-system/components/molecules/Tooltip';
import Avatar from '../../design-system/components/atoms/Avatar';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 border-b"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div />

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        {/* Language toggle */}
        <LanguageToggle />

        <Tooltip content={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="تبديل النمط"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </Tooltip>

        {/* Notifications */}
        <Tooltip content={t('common.notifications')}>
          <button
            className="p-2 rounded-lg transition-colors relative"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="الإشعارات"
          >
            <Bell size={16} />
          </button>
        </Tooltip>

        {/* User menu */}
        <Dropdown
          align="end"
          trigger={
            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Avatar name={user?.name} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                  {user?.name}
                </p>
                <p className="text-2xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {user?.role ? t(`roles.${user.role}`, { defaultValue: fmt.role(user.role) }) : ''}
                </p>
              </div>
              <ChevronDown size={13} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          }
        >
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-2xs" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
          </div>
          <DropdownItem
            icon={Settings}
            onSelect={() => navigate(user?.role === 'admin' ? '/admin/settings/account' : '/settings/account')}
          >
            {t('common.accountSettings')}
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={LogOut} onSelect={handleLogout} destructive>
            {t('common.signOut')}
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
