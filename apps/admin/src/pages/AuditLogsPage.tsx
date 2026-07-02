import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import clsx from 'clsx';

interface AuditLogEntry {
  id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  detail?: string | null;
  ip_hash?: string | null;
  user_agent?: string | null;
  created_at: string;
}

interface PaginatedLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  'link.create': 'bg-emerald-500/20 text-emerald-400',
  'link.update': 'bg-blue-500/20 text-blue-400',
  'link.delete': 'bg-red-500/20 text-red-400',
  'link.disable': 'bg-amber-500/20 text-amber-400',
  'link.enable': 'bg-emerald-500/20 text-emerald-400',
  'link.archive': 'bg-slate-500/20 text-slate-400',
  'link.restore': 'bg-cyan-500/20 text-cyan-400',
  'link.bulk_delete': 'bg-red-500/20 text-red-400',
  'link.bulk_disable': 'bg-amber-500/20 text-amber-400',
  'link.bulk_enable': 'bg-emerald-500/20 text-emerald-400',
  'link.bulk_tag': 'bg-purple-500/20 text-purple-400',
  'link.bulk_archive': 'bg-slate-500/20 text-slate-400',
  'tag.create': 'bg-purple-500/20 text-purple-400',
  'tag.delete': 'bg-red-500/20 text-red-400',
  'settings.update': 'bg-blue-500/20 text-blue-400',
  'import.confirm': 'bg-cyan-500/20 text-cyan-400',
};

const ACTION_OPTIONS = [
  '',
  'link.create',
  'link.update',
  'link.delete',
  'link.disable',
  'link.enable',
  'link.archive',
  'link.restore',
  'link.bulk_delete',
  'link.bulk_disable',
  'link.bulk_enable',
  'link.bulk_tag',
  'link.bulk_archive',
  'tag.create',
  'tag.delete',
  'settings.update',
  'import.confirm',
];

export default function AuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const action = searchParams.get('action') ?? '';
  const targetType = searchParams.get('target_type') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (targetType) params.set('target_type', targetType);
      params.set('page', String(page));
      params.set('pageSize', '50');

      const data = await apiGet<PaginatedLogs>(`/api/audit-logs?${params}`);
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [action, targetType, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Audit Logs</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-500" />
        <select
          value={action}
          onChange={(e) => setParam('action', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={targetType}
          onChange={(e) => setParam('target_type', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="link">Link</option>
          <option value="tag">Tag</option>
          <option value="settings">Settings</option>
          <option value="import">Import</option>
        </select>
        <span className="text-sm text-slate-500">{total} total entries</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No audit logs found</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Detail</th>
                <th className="px-4 py-3">IP Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      ACTION_COLORS[log.action] ?? 'bg-slate-500/20 text-slate-400'
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {log.target_type && (
                      <span className="text-slate-500">{log.target_type}</span>
                    )}
                    {log.target_id && (
                      <span className="ml-1 font-mono text-slate-400" title={log.target_id}>
                        {log.target_id.length > 12 ? log.target_id.slice(0, 12) + '...' : log.target_id}
                      </span>
                    )}
                    {!log.target_type && !log.target_id && <span className="text-slate-600">-</span>}
                  </td>
                  <td className="max-w-[300px] truncate px-4 py-3 text-xs text-slate-400" title={log.detail ?? ''}>
                    {log.detail ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {log.ip_hash ? log.ip_hash.slice(0, 8) + '...' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{total} entries total</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setParam('page', String(page + 1))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
