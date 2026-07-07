import React, { useState } from 'react';
import { LinkIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';

const TEMPLATES: Record<string, { source: string; medium: string; campaign: string }> = {
  newsletter: { source: 'newsletter', medium: 'email', campaign: '' },
  social: { source: 'social', medium: 'social', campaign: '' },
  ads: { source: 'google', medium: 'cpc', campaign: '' },
  affiliate: { source: 'affiliate', medium: 'referral', campaign: '' },
};

function appendUtmParams(url: string, values: Record<string, string>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim();
    if (trimmed) parsed.searchParams.set(key, trimmed);
  }
  return parsed.toString();
}

export function UtmBuilder({
  longUrl,
  onApply,
  disabled,
}: {
  longUrl: string;
  onApply: (url: string) => void;
  disabled?: boolean;
}) {
  const [template, setTemplate] = useState('');
  const [utm, setUtm] = useState({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });
  const [error, setError] = useState('');

  const set = (key: keyof typeof utm, value: string) => {
    setUtm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const applyTemplate = (value: string) => {
    setTemplate(value);
    const next = TEMPLATES[value];
    if (!next) return;
    setUtm((current) => ({
      ...current,
      source: next.source,
      medium: next.medium,
      campaign: next.campaign,
    }));
    setError('');
  };

  const apply = () => {
    try {
      if (!/^https?:\/\//i.test(longUrl.trim())) {
        setError('Enter a valid destination URL first');
        return;
      }

      const nextUrl = appendUtmParams(longUrl.trim(), {
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        utm_term: utm.term,
        utm_content: utm.content,
      });
      onApply(nextUrl);
      setError('');
    } catch {
      setError('Enter a valid destination URL first');
    }
  };

  return (
    <div className="space-y-3 border-t border-slate-800 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">UTM Template</h2>
          <p className="text-xs text-slate-500">Build campaign parameters into the destination URL.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" icon={<LinkIcon size={14} />} onClick={apply} disabled={disabled}>
          Apply
        </Button>
      </div>

      <Select label="Template" value={template} onChange={(e) => applyTemplate(e.target.value)} disabled={disabled}>
        <option value="">Custom</option>
        <option value="newsletter">Newsletter</option>
        <option value="social">Social</option>
        <option value="ads">Paid Ads</option>
        <option value="affiliate">Affiliate</option>
      </Select>

      <div className="grid gap-3 md:grid-cols-2">
        <Input label="utm_source" value={utm.source} onChange={(e) => set('source', e.target.value)} disabled={disabled} />
        <Input label="utm_medium" value={utm.medium} onChange={(e) => set('medium', e.target.value)} disabled={disabled} />
        <Input label="utm_campaign" value={utm.campaign} onChange={(e) => set('campaign', e.target.value)} disabled={disabled} />
        <Input label="utm_term" value={utm.term} onChange={(e) => set('term', e.target.value)} disabled={disabled} />
      </div>

      <Input label="utm_content" value={utm.content} onChange={(e) => set('content', e.target.value)} disabled={disabled} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
