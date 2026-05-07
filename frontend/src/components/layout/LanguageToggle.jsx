import { Languages, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { applyLanguage, SUPPORTED_LANGS } from '../../i18n';
import { Dropdown, DropdownItem } from '../../design-system/components/molecules/Dropdown';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = SUPPORTED_LANGS.find((l) => l.code === i18n.language) || SUPPORTED_LANGS[0];

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label={t('common.language')}
          title={t('common.language')}
        >
          <Languages size={16} />
          <span className="text-xs font-semibold">{current.flag}</span>
        </button>
      }
    >
      {SUPPORTED_LANGS.map((lang) => {
        const isActive = lang.code === i18n.language;
        return (
          <DropdownItem
            key={lang.code}
            onSelect={() => applyLanguage(lang.code)}
            className={isActive ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}
          >
            <span className="inline-block w-6 text-2xs font-bold opacity-60">{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {isActive && <Check size={14} className="opacity-80" />}
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
}
