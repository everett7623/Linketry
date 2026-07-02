import { useState } from 'react';
import { apiPut } from '../api/client';
import type { Link } from '@linkora/shared';
import { X } from 'lucide-react';

interface Props {
  link: Link;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditLinkDialog({ link, onClose, onSaved }: Props) {
  const [longUrl, setLongUrl] = useState(link.long_url);
  const [slug, setSlug] = useState(link.slug);
  const [title, setTitle] = useState(link.title ?? '');
  const [description, setDescription] = useState(link.description ?? '');
  const [tags, setTags] = useState(parseTags(link.tags).join(', '));
  const [redirectType, setRedirectType] = useState<number>(link.redirect_type);
  const [status, setStatus] = useState(link.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await apiPut(`/api/links/${link.id}`, {
        long_url: longUrl,
        slug,
        title: title || null,
        description: description || null,
        tags: tagsArr.length > 0 ? tagsArr : [],
        redirect_type: redirectType,
        status,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Edit Link</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4 px-5 py-4">
          <Field label="Long URL" value={longUrl} onChange={setLongUrl} required />
          <Field label="Slug" value={slug} onChange={setSlug} required />
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Description" value={description} onChange={setDescription} />
          <Field label="Tags (comma separated)" value={tags} onChange={setTags} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Redirect Type</label>
              <select
                value={redirectType}
                onChange={(e) => setRedirectType(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                <option value={302}>302 (Temporary)</option>
                <option value={301}>301 (Permanent)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Link['status'])}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
