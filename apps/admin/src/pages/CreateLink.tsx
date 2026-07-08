import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { createLink } from '../api/links';
import { listDomains } from '../api/domains';
import { fetchPageTitle } from '../api/metadata';
import { listTags } from '../api/tags';
import { TagSuggestions } from '../components/TagSuggestions';
import { UtmBuilder } from '../components/UtmBuilder';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import type { Domain, Tag } from '@linkora/shared';

export function CreateLink() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [form, setForm] = useState({
    long_url: '',
    slug: '',
    domain: '',
    title: '',
    tags: '',
    redirect_type: '302' as '301' | '302',
    expires_at: '',
    max_clicks: '',
    password: '',
    warning_enabled: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    listTags()
      .then(setTagCatalog)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    listDomains()
      .then((items) => {
        setDomains(items);
        const defaultDomain = items.find((domain) => domain.is_default === 1 && domain.status === 'active');
        if (defaultDomain) {
          setForm((current) => ({ ...current, domain: defaultDomain.domain }));
        }
      })
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.long_url.trim()) errs.long_url = 'Destination URL is required';
    else if (!/^https?:\/\//i.test(form.long_url.trim())) errs.long_url = 'URL must start with http:// or https://';
    if (form.slug && !/^[a-zA-Z0-9_-]+$/.test(form.slug)) errs.slug = 'Slug can only contain letters, numbers, _ and -';
    if (form.expires_at && Number.isNaN(new Date(form.expires_at).getTime())) errs.expires_at = 'Enter a valid date and time';
    if (form.max_clicks) {
      const maxClicks = Number(form.max_clicks);
      if (!Number.isInteger(maxClicks) || maxClicks < 1) errs.max_clicks = 'Max clicks must be a positive integer';
    }
    if (form.password && form.password.trim().length < 4) errs.password = 'Password must be at least 4 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFetchTitle = async () => {
    const url = form.long_url.trim();
    if (!url) {
      setErrors((e) => ({ ...e, long_url: 'Destination URL is required' }));
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setErrors((e) => ({ ...e, long_url: 'URL must start with http:// or https://' }));
      return;
    }

    setTitleLoading(true);
    try {
      const result = await fetchPageTitle(url);
      set('title', result.title);
      success('Title fetched');
    } catch (e) {
      error(String(e));
    } finally {
      setTitleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const expiresAt = form.expires_at ? new Date(form.expires_at).toISOString() : undefined;
      const maxClicks = form.max_clicks ? Number(form.max_clicks) : undefined;
      const link = await createLink({
        long_url: form.long_url.trim(),
        slug: form.slug.trim() || undefined,
        domain: form.domain || undefined,
        title: form.title.trim() || undefined,
        tags: tags.length ? tags : undefined,
        redirect_type: form.redirect_type === '301' ? 301 : 302,
        expires_at: expiresAt,
        max_clicks: maxClicks,
        password: form.password.trim() || undefined,
        warning_enabled: form.warning_enabled ? 1 : 0,
      });
      success(`Link /${link.slug} created!`);
      navigate('/links');
    } catch (e) {
      error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Create Link</h1>
          <p className="text-sm text-slate-400 mt-0.5">Add a new short link</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <Input
          label="Destination URL *"
          placeholder="https://example.com/long/path"
          value={form.long_url}
          onChange={(e) => set('long_url', e.target.value)}
          error={errors.long_url}
          hint="The URL this short link will redirect to"
          autoFocus
        />

        <Input
          label="Custom Slug (optional)"
          placeholder="my-link"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          error={errors.slug}
          hint="Leave blank to auto-generate. Letters, numbers, - and _ only."
        />

        <Select
          label="Short Domain"
          value={form.domain}
          onChange={(e) => set('domain', e.target.value)}
        >
          <option value="">API host</option>
          {domains
            .filter((domain) => domain.status === 'active')
            .map((domain) => (
              <option key={domain.id} value={domain.domain}>
                {domain.domain}{domain.is_default === 1 ? ' (default)' : ''}
              </option>
            ))}
        </Select>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label="Title (optional)"
            placeholder="My awesome link"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleFetchTitle}
            loading={titleLoading}
            disabled={loading}
            icon={<RefreshCw size={14} />}
            className="sm:mb-0.5"
          >
            Fetch Title
          </Button>
        </div>

        <Input
          label="Tags (optional)"
          placeholder="marketing, campaign, product"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          hint="Comma-separated tags. Existing catalog tags are available below."
        />
        <TagSuggestions
          tags={tagCatalog}
          value={form.tags}
          onChange={(value) => set('tags', value)}
        />

        <Select
          label="Redirect Type"
          value={form.redirect_type}
          onChange={(e) => set('redirect_type', e.target.value as '301' | '302')}
        >
          <option value="302">302 — Temporary (recommended)</option>
          <option value="301">301 — Permanent (cached by browser)</option>
        </Select>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Expires At (optional)"
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => set('expires_at', e.target.value)}
            error={errors.expires_at}
          />

          <Input
            label="Max Clicks (optional)"
            type="number"
            min={1}
            step={1}
            placeholder="1000"
            value={form.max_clicks}
            onChange={(e) => set('max_clicks', e.target.value)}
            error={errors.max_clicks}
          />
        </div>

        <div className="space-y-4 border-t border-slate-800 pt-5">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.warning_enabled}
              onChange={(e) => set('warning_enabled', e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
            />
            Show safety warning before redirect
          </label>

          <Input
            label="Password (optional)"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            hint="Visitors must enter this password before opening the destination."
          />
        </div>

        <UtmBuilder
          longUrl={form.long_url}
          onApply={(url) => set('long_url', url)}
          disabled={loading}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>Create Link</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/links')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
