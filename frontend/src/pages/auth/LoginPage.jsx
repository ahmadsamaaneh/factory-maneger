import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { login } from '../../services/authService';
import useAuthStore from '../../store/authStore';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import { errMsg } from '../../utils/formatters';
import LanguageToggle from '../../components/layout/LanguageToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = t('auth.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t('auth.emailInvalid');
    if (!form.password) e.password = t('auth.passwordRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { token, user } = await login(form.email, form.password);
      setAuth(user, token);
      toast.success(t('auth.welcomeBack', { name: user.name }));
      navigate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const change = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg">
            <FlaskConical size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.factoryErp')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('auth.signInTitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label={t('auth.emailLabel')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={form.email}
              onChange={change('email')}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={change('password')}
                  autoComplete="current-password"
                  className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">{t('auth.demoCredentials')}</p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <div className="flex justify-between"><span className="font-medium">المسؤول</span><span>admin@factory.com</span></div>
              <div className="flex justify-between"><span></span><span className="text-gray-400">Admin@123456</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
