import React, { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import { getSettings, updateSettings } from '../api/settings';
import { getWebhookConfig, testWebhook, updateWebhookConfig } from '../api/webhooks';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

function eventLabel(event: string): string {
  return event
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function Settings() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [form, setForm] = useState({
    site_name: 'Linkora',
    default_redirect_type: '302',
    default_domain: '',
  });
  const [webhook, setWebhook] = useState({
    enabled: false,
    url: '',
    secret: '',
    has_secret: false,
    events: [] as string[],
    available_events: [] as string[],
  });

  useEffect(() => {
    Promise.all([getSettings(), getWebhookConfig()])
      .then(([s, webhookConfig]) => {
        setForm({
          site_name: s.site_name ?? 'Linkora',
          default_redirect_type: s.default_redirect_type ?? '302',
          default_domain: s.default_domain ?? '',
        });
        setWebhook({
          enabled: webhookConfig.enabled,
          url: webhookConfig.url,
          secret: '',
          has_secret: webhookConfig.has_secret,
          events: webhookConfig.events,
          available_events: webhookConfig.available_events,
        });
      })
      .catch(() => error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setWebhookField = <K extends keyof typeof webhook>(key: K, value: (typeof webhook)[K]) => {
    setWebhook((current) => ({ ...current, [key]: value }));
  };

  const toggleWebhookEvent = (event: string) => {
    setWebhook((current) => ({
      ...current,
      events: current.events.includes(event)
        ? current.events.filter((item) => item !== event)
        : [...current.events, event],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      success('Settings saved');
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookSaving(true);
    try {
      const updated = await updateWebhookConfig({
        enabled: webhook.enabled,
        url: webhook.url.trim(),
        events: webhook.events,
        ...(webhook.secret.trim() ? { secret: webhook.secret.trim() } : {}),
      });
      setWebhook({
        enabled: updated.enabled,
        url: updated.url,
        secret: '',
        has_secret: updated.has_secret,
        events: updated.events,
        available_events: updated.available_events,
      });
      success('Webhook settings saved');
    } catch (e) {
      error(String(e));
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setWebhookTesting(true);
    try {
      await testWebhook();
      success('Webhook test delivered');
    } catch (e) {
      error(String(e));
    } finally {
      setWebhookTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configure your Linkora instance</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">General</h2>

        <Input
          label="Site Name"
          value={form.site_name}
          onChange={(e) => set('site_name', e.target.value)}
          hint="Displayed in the admin panel title"
        />

        <Input
          label="Default Domain"
          placeholder="go.example.com"
          value={form.default_domain}
          onChange={(e) => set('default_domain', e.target.value)}
          hint="Used to construct short_url. Leave blank to use request hostname."
        />

        <Select
          label="Default Redirect Type"
          value={form.default_redirect_type}
          onChange={(e) => set('default_redirect_type', e.target.value)}
        >
          <option value="302">302 — Temporary (recommended)</option>
          <option value="301">301 — Permanent (cached by browser)</option>
        </Select>

        <div className="pt-2">
          <Button type="submit" icon={<Save size={15} />} loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>

      <form onSubmit={handleWebhookSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">Webhooks</h2>

        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={webhook.enabled}
            onChange={(e) => setWebhookField('enabled', e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
          />
          Enable webhook delivery
        </label>

        <Input
          label="Webhook URL"
          placeholder="https://example.com/linkora/webhook"
          value={webhook.url}
          onChange={(e) => setWebhookField('url', e.target.value)}
        />

        <Input
          label="Signing Secret"
          type="password"
          placeholder={webhook.has_secret ? 'Secret already configured' : 'Optional'}
          value={webhook.secret}
          onChange={(e) => setWebhookField('secret', e.target.value)}
          hint={webhook.has_secret ? 'Leave blank to keep the current secret.' : undefined}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Events</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {webhook.available_events.map((event) => (
              <label
                key={event}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={webhook.events.includes(event)}
                  onChange={() => toggleWebhookEvent(event)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-600 focus:ring-brand-500"
                />
                {eventLabel(event)}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" icon={<Save size={15} />} loading={webhookSaving}>
            Save Webhook
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={<Send size={15} />}
            loading={webhookTesting}
            disabled={!webhook.url.trim() || webhookSaving}
            onClick={handleTestWebhook}
          >
            Send Test
          </Button>
        </div>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">About</h2>
        <div className="text-sm text-slate-400 space-y-1">
          <p>Version: <span className="text-slate-200 font-mono">0.1.0</span></p>
          <p>Platform: <span className="text-slate-200">Cloudflare Workers + D1 + KV</span></p>
          <p>
            Documentation:{' '}
            <a href="https://github.com/everett7623/Linkora" target="_blank" rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300">
              GitHub →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
