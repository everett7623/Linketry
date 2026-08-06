import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { getSettings, updateSettings } from '../api/settings';
import { ResetSettingsPanel } from '../components/settings/ResetSettingsPanel';
import { WebhookSettingsPanel } from '../components/settings/WebhookSettingsPanel';
import { NotificationSettingsPanel } from '../components/settings/NotificationSettingsPanel';
import { AdminModePanel } from '../components/settings/AdminModePanel';
import { DisplayPreferencesPanel } from '../components/settings/DisplayPreferencesPanel';
import { ThemePanel } from '../components/settings/ThemePanel';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAdminMode } from '../contexts/AdminModeContext';
import { useLocale } from '../contexts/LocaleContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ReleaseStatusPanel } from '../components/settings/ReleaseStatusPanel';
import type { MessageKey } from '../i18n/messages';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';
import { clsx } from 'clsx';

type SettingsSectionId = 'general' | 'appearance' | 'integrations' | 'danger-zone' | 'release';

interface SettingsSection {
  id: SettingsSectionId;
  label: MessageKey;
  advanced?: boolean;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'general', label: 'general' },
  { id: 'appearance', label: 'appearance' },
  { id: 'integrations', label: 'integrations', advanced: true },
  { id: 'danger-zone', label: 'dangerZone', advanced: true },
  { id: 'release', label: 'releaseSection' },
];

export function Settings() {
  const { success, error } = useToast();
  const { isAdvanced } = useAdminMode();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general');
  const [form, setForm] = useState({
    site_name: 'Linketry',
    default_redirect_type: '302',
    default_domain: '',
    analytics_retention_days: '0',
    backup_retention_days: '30',
    public_page_404_message: '',
    public_page_disabled_message: '',
    public_page_expired_message: '',
    public_page_warning_message: '',
  });

  const visibleSections = useMemo(
    () => SETTINGS_SECTIONS.filter((section) => isAdvanced || !section.advanced),
    [isAdvanced]
  );

  useEffect(() => {
    getSettings()
      .then((s) => {
        setForm({
          site_name: s.site_name ?? 'Linketry',
          default_redirect_type: s.default_redirect_type ?? '302',
          default_domain: s.default_domain ?? '',
          analytics_retention_days: s.analytics_retention_days ?? '0',
          backup_retention_days: s.backup_retention_days ?? '30',
          public_page_404_message: s.public_page_404_message ?? '',
          public_page_disabled_message: s.public_page_disabled_message ?? '',
          public_page_expired_message: s.public_page_expired_message ?? '',
          public_page_warning_message: s.public_page_warning_message ?? '',
        });
      })
      .catch(() => error(t('loadSettingsFailed')))
      .finally(() => setLoading(false));
  }, [error, t]);

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === activeSection)) {
      setActiveSection(visibleSections[0]?.id ?? 'general');
    }
  }, [activeSection, visibleSections]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '') as SettingsSectionId | 'notifications' | '';
    if (!hash) return;
    const mapped: SettingsSectionId =
      hash === 'notifications' ? 'integrations' : (hash as SettingsSectionId);
    if (visibleSections.some((section) => section.id === mapped)) {
      setActiveSection(mapped);
      window.requestAnimationFrame(() => {
        document.getElementById(`settings-${mapped}`)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [visibleSections]);

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      success(t('settingsSaved'));
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setSaving(false);
    }
  };

  const goToSection = (id: SettingsSectionId) => {
    setActiveSection(id);
    const el = document.getElementById(`settings-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t('settings')}</h1>
        <p className="mt-0.5 text-sm text-slate-400">{t('configureInstance')}</p>
      </div>

      <nav
        aria-label={t('settingsSections')}
        className="sticky top-14 z-20 -mx-1 border-b border-slate-800 bg-slate-950/95 px-1 py-2 backdrop-blur lg:top-16"
      >
        <div role="tablist" className="flex gap-1 overflow-x-auto scrollbar-thin">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              aria-controls={`settings-${section.id}`}
              id={`settings-tab-${section.id}`}
              onClick={() => goToSection(section.id)}
              className={clsx(
                'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              )}
            >
              {t(section.label)}
            </button>
          ))}
        </div>
      </nav>

      <section
        id="settings-general"
        role="tabpanel"
        aria-labelledby="settings-tab-general"
        className="scroll-mt-28 space-y-5 lg:scroll-mt-24"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="border-b border-slate-800 pb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t('general')}
          </h2>

          <Input
            label={t('siteName')}
            value={form.site_name}
            onChange={(e) => set('site_name', e.target.value)}
            hint={t('siteNameHint')}
          />

          <Input
            label={t('defaultDomain')}
            placeholder="go.example.com"
            value={form.default_domain}
            onChange={(e) => set('default_domain', e.target.value)}
            hint={t('defaultDomainHint')}
          />

          <Select
            label={t('redirectType')}
            value={form.default_redirect_type}
            onChange={(e) => set('default_redirect_type', e.target.value)}
          >
            <option value="302">302 {t('temporary')}</option>
            <option value="301">301 {t('permanent')}</option>
          </Select>

          {isAdvanced && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('retentionDays')}
                type="number"
                min="0"
                max="3650"
                value={form.analytics_retention_days}
                onChange={(e) => set('analytics_retention_days', e.target.value)}
                hint={t('retentionHint')}
              />
              <Input
                label={t('backupRetentionDays')}
                type="number"
                min="1"
                max="3650"
                value={form.backup_retention_days}
                onChange={(e) => set('backup_retention_days', e.target.value)}
                hint={t('backupRetentionHint')}
              />
            </div>
          )}

          {isAdvanced && (
            <div className="space-y-4 border-t border-slate-800 pt-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">{t('publicPageTemplates')}</h2>
                <p className="mt-1 text-xs text-slate-500">{t('publicPageTemplatesHint')}</p>
              </div>
              <Textarea
                label={t('notFoundPageMessage')}
                maxLength={500}
                rows={2}
                value={form.public_page_404_message}
                onChange={(e) => set('public_page_404_message', e.target.value)}
              />
              <Textarea
                label={t('disabledPageMessage')}
                maxLength={500}
                rows={2}
                value={form.public_page_disabled_message}
                onChange={(e) => set('public_page_disabled_message', e.target.value)}
              />
              <Textarea
                label={t('expiredPageMessage')}
                maxLength={500}
                rows={2}
                value={form.public_page_expired_message}
                onChange={(e) => set('public_page_expired_message', e.target.value)}
              />
              <Textarea
                label={t('warningPageMessage')}
                maxLength={500}
                rows={2}
                value={form.public_page_warning_message}
                onChange={(e) => set('public_page_warning_message', e.target.value)}
              />
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" icon={<Save size={15} />} loading={saving}>
              {t('saveSettings')}
            </Button>
          </div>
        </form>
      </section>

      <section
        id="settings-appearance"
        role="tabpanel"
        aria-labelledby="settings-tab-appearance"
        className="scroll-mt-28 space-y-8 lg:scroll-mt-24"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('appearance')}
        </h2>
        <AdminModePanel />
        <DisplayPreferencesPanel />
        <ThemePanel />
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="border-b border-slate-800 pb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t('language')}
          </h3>
          <div className="max-w-xs">
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      {isAdvanced && (
        <section
          id="settings-integrations"
          role="tabpanel"
          aria-labelledby="settings-tab-integrations"
          className="scroll-mt-28 space-y-8 lg:scroll-mt-24"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t('integrations')}
          </h2>
          <WebhookSettingsPanel />
          <div id="notifications" className="scroll-mt-28 lg:scroll-mt-24">
            <NotificationSettingsPanel />
          </div>
        </section>
      )}

      {isAdvanced && (
        <section
          id="settings-danger-zone"
          role="tabpanel"
          aria-labelledby="settings-tab-danger-zone"
          className="scroll-mt-28 space-y-8 lg:scroll-mt-24"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t('dangerZone')}
          </h2>
          <ResetSettingsPanel />
        </section>
      )}

      <section
        id="settings-release"
        role="tabpanel"
        aria-labelledby="settings-tab-release"
        className="scroll-mt-28 space-y-8 lg:scroll-mt-24"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('releaseSection')}
        </h2>
        <ReleaseStatusPanel />
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="border-b border-slate-800 pb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t('about')}
          </h3>
          <div className="space-y-1 text-sm text-slate-400">
            <p>
              {t('version')}: <span className="font-mono text-slate-200">{LINKETRY_VERSION}</span>
            </p>
            <p>
              {t('platform')}: <span className="text-slate-200">Cloudflare Workers + D1 + KV</span>
            </p>
            <p>
              {t('documentation')}:{' '}
              <a
                href="https://github.com/everett7623/Linketry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300"
              >
                GitHub
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
