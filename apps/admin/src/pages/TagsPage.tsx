import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../api/client';
import type { Tag } from '@linkora/shared';
import { Tags, Plus, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function fetchTags() {
    setLoading(true);
    apiGet<Tag[]>('/api/tags')
      .then(setTags)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTags(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await apiPost('/api/tags', { name: name.trim(), color, description: description || undefined });
      setName('');
      setDescription('');
      fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, tagName: string) {
    if (!confirm(`Delete tag "${tagName}"?`)) return;
    try {
      await apiDelete(`/api/tags/${id}`);
      fetchTags();
    } catch {
      alert('Failed to delete tag');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Tags className="h-5 w-5 text-brand-400" />
        <h1 className="text-xl font-bold text-white">Tags</h1>
      </div>

      {/* Create Tag */}
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-slate-400">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="w-20">
          <label className="block text-xs font-medium text-slate-400">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-1"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-slate-400">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Tags List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : tags.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No tags yet</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color ?? '#6366f1' }} />
                  <div>
                    <p className="text-sm font-medium text-white">{tag.name}</p>
                    {tag.description && <p className="text-xs text-slate-400">{tag.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{dayjs(tag.created_at).format('YYYY-MM-DD')}</span>
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
