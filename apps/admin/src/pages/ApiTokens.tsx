import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { createApiToken, listApiTokens, revokeApiToken } from '../api/tokens';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import type { ApiToken, ApiTokenScope } from '@linkora/shared';
import dayjs from 'dayjs';

const SCOPE_OPTIONS: Array<{ value: ApiTokenScope; label: string }> = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'admin', label: 'Admin' },
];

function ScopePills({ scopes }: { scopes: ApiTokenScope[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {scopes.map((scope) => (
        <span
          key={scope}
          className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-300"
        >
          {scope}
        </span>
      ))}
    </div>
  );
}

export function ApiTokens() {
  const { success, error } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<ApiTokenScope[]>(['read']);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiToken | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTokens(await listApiTokens());
    } catch {
      error('Failed to load API tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = tokens.filter((token) => !token.revoked_at).length;

  const toggleScope = (scope: ApiTokenScope) => {
    setScopes((current) => {
      if (scope === 'admin') return current.includes('admin') ? ['read'] : ['admin'];
      const withoutAdmin = current.filter((item) => item !== 'admin');
      const next = withoutAdmin.includes(scope)
        ? withoutAdmin.filter((item) => item !== scope)
        : [...withoutAdmin, scope];
      return next.length > 0 ? next : ['read'];
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      error('Name is required');
      return;
    }

    setCreating(true);
    try {
      const result = await createApiToken({ name: name.trim(), scopes });
      setNewToken(result.token);
      setName('');
      setScopes(['read']);
      setCreateOpen(false);
      success('API token created');
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeApiToken(revokeTarget.id);
      success('API token revoked');
      setRevokeTarget(null);
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setRevoking(false);
    }
  };

  const copyNewToken = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    success('Token copied');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">API Tokens</h1>
          <p className="text-sm text-slate-400 mt-0.5">{activeCount.toLocaleString()} active tokens</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
          Create Token
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Active</span>
            <KeyRound size={17} className="text-brand-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">{activeCount.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Admin Tokens</span>
            <ShieldCheck size={17} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {tokens.filter((token) => !token.revoked_at && token.scopes.includes('admin')).length.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Revoked</span>
            <Trash2 size={17} className="text-red-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {tokens.filter((token) => token.revoked_at).length.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400">No API tokens yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Scopes</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Last Used</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{token.name}</td>
                    <td className="px-4 py-3"><ScopePills scopes={token.scopes} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {dayjs(token.created_at).format('YYYY-MM-DD HH:mm')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {token.last_used_at ? dayjs(token.last_used_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        token.revoked_at ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {token.revoked_at ? 'revoked' : 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        disabled={!!token.revoked_at}
                        onClick={() => setRevokeTarget(token)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create API Token" size="md">
        <div className="space-y-5">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Automation, backup script, reporting"
          />

          <div>
            <label className="text-sm font-medium text-slate-300">Scopes</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {SCOPE_OPTIONS.map((option) => {
                const checked = scopes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleScope(option.value)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? 'border-brand-500 bg-brand-500/10 text-brand-200'
                        : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {option.label}
                    {checked && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!newToken} onClose={() => setNewToken(null)} title="New API Token" size="lg">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
            <p className="break-all font-mono text-sm text-slate-200">{newToken}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" icon={<Copy size={14} />} onClick={copyNewToken}>
              Copy
            </Button>
            <Button onClick={() => setNewToken(null)}>Done</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke API Token"
        message={`Revoke "${revokeTarget?.name ?? ''}"? Existing requests using this token will stop working.`}
        confirmLabel="Revoke"
        loading={revoking}
      />
    </div>
  );
}
