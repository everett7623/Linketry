import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '../api/client';
import { Settings, Save } from 'lucide-react';

interface SettingsMap {
  [key: string]: string;
}

const SETTING_FIELDS = [
  { key: 'site_name', label: 'Site Name', type: 'text', placeholder: 'Linkora' },
  { key: 'default_redirect_type', label: 'Default Redirect Type', type: 'select', options: [{ value: '302', label: '302 (Temporary)' }, { value: '301', label: '301 (Permanent)' }] },
  { key: 'default_domain', label: 'Default Domain', type: 'text', placeholder: 'go.y8o.de' },
] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<SettingsMap>('/api/settings')
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await apiPut('/api/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-brand-400" />
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        {SETTING_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-slate-300">{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={settings[field.key] ?? ''}
                onChange={(e) => update(field.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={settings[field.key] ?? ''}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Settings saved successfully</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
