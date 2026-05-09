import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English',  dir: 'ltr', flag: 'EN' },
  { code: 'ar', label: 'العربية',  dir: 'rtl', flag: 'AR' },
];

const STORAGE_KEY = 'app.lang';

const initialLang = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.some((l) => l.code === saved)) return saved;
  } catch (_) { /* ignore */ }
  return 'ar';
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: initialLang,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

/** Apply <html lang="…" dir="…"> + persist + propagate change events. */
export function applyLanguage(code) {
  const lang = SUPPORTED_LANGS.find((l) => l.code === code) || SUPPORTED_LANGS[0];
  i18n.changeLanguage(lang.code);
  document.documentElement.setAttribute('lang', lang.code);
  document.documentElement.setAttribute('dir', lang.dir);
  try { localStorage.setItem(STORAGE_KEY, lang.code); } catch (_) { /* ignore */ }
}

// Apply once on initial load
applyLanguage(initialLang);

export default i18n;
