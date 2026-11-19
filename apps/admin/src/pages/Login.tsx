import React, { useState } from 'react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { getApiBase, getBuildApiBase, normalizeApiBase, setApiBaseOverride } from '../api/client';
import { getSettings } from '../api/settings';
import { getOverview } from '../api/links';
import { useLocale } from '../contexts/LocaleContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { DeploymentAccessGuide } from '../components/setup/DeploymentAccessGuide';
import { BrandMark } from '../components/BrandMark';
import { DEMO_ACCESS_CODE, IS_PUBLIC_DEMO } from '../config/demo';

export function Login() {
  const [token, setToken] = useState('');
  const [apiOrigin, setApiOrigin] = useState(() => getApiBase());
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    if (!IS_PUBLIC_DEMO) {
      const normalizedApiOrigin = normalizeApiBase(apiOrigin);
      if (apiOrigin.trim() && !normalizedApiOrigin) {
        error(t('invalidOrigin'));
        return;
      }
      setApiBaseOverride(apiOrigin);
    }
    setLoading(true);
    try {
      const result = await login(token.trim());
      if (result === 'authenticated') {
        try {
          const [overview, settings] = await Promise.all([getOverview(), getSettings()]);
          const needsSetup = !settings.default_domain?.trim() || (overview?.totalLinks ?? 0) === 0;
          navigate(needsSetup ? '/setup' : '/overview', { replace: true });
        } catch {
          navigate('/overview', { replace: true });
        }
      } else if (result === 'unreachable') {
        error(t('unreachableApi'));
      } else {
        error(t(IS_PUBLIC_DEMO ? 'invalidDemoAccessCode' : 'invalidToken'));
      }
    } catch {
      error(t('unreachableApi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 rounded-2xl shadow-lg shadow-brand-600/20">
            <BrandMark size="lg" decorative={false} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Linketry Admin</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t(IS_PUBLIC_DEMO ? 'demoLoginSubtitle' : 'adminSubtitle')}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="mb-5">
            <Input
              id="linketry-access-token"
              label={t(IS_PUBLIC_DEMO ? 'demoAccessCode' : 'adminToken')}
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t(IS_PUBLIC_DEMO ? 'demoAccessCodePlaceholder' : 'enterToken')}
              autoFocus
              className="bg-slate-950 py-2.5"
              hint={
                IS_PUBLIC_DEMO ? t('demoAccessHint', { code: DEMO_ACCESS_CODE }) : undefined
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  aria-label={t(
                    IS_PUBLIC_DEMO
                      ? showToken
                        ? 'hideDemoAccessCode'
                        : 'showDemoAccessCode'
                      : showToken
                        ? 'hideAdminToken'
                        : 'showAdminToken'
                  )}
                  className="text-slate-500 transition-colors hover:text-slate-300"
                >
                  {showToken ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              }
            />
          </div>

          {!IS_PUBLIC_DEMO && (
            <div className="mb-5">
              <Input
                id="linketry-api-origin"
                label={t('apiOrigin')}
                type="url"
                value={apiOrigin}
                onChange={(e) => setApiOrigin(e.target.value)}
                placeholder="https://go.example.com"
                className="bg-slate-950 py-2.5"
                hint={
                  getBuildApiBase()
                    ? t('defaultValue', { value: getBuildApiBase() })
                    : t('defaultSameOrigin')
                }
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full justify-center"
            loading={loading}
            disabled={!token.trim()}
          >
            {t(IS_PUBLIC_DEMO ? 'enterDemo' : 'signIn')}
          </Button>
        </form>

        {!IS_PUBLIC_DEMO && (
          <div className="mt-4">
            <DeploymentAccessGuide apiOrigin={apiOrigin} compact />
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-6">
          Linketry v{LINKETRY_VERSION} — {t('selfHosted')}
        </p>
        <div className="mx-auto mt-4 w-44">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
