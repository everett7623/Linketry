import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Link2,
  RefreshCw,
  Settings,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { listBackups, type BackupsList } from '../api/backups';
import { listDomains } from '../api/domains';
import { getOverview } from '../api/links';
import { getSettings } from '../api/settings';
import { getAdminApiOrigin } from '../api/system';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import type { Domain, Link as LinkType } from '@linkora/shared';

type CheckStatus = 'ok' | 'warn' | 'fail';

interface SetupState {
  settings: Record<string, string>;
  domains: Domain[];
  backups: BackupsList | null;
  overview: {
    totalLinks: number;
    totalClicks: number;
    todayClicks: number;
    recentLinks: LinkType[];
    topLinks: LinkType[];
  } | null;
}

interface SetupCheck {
  title: string;
  detail: string;
  status: CheckStatus;
  actionLabel?: string;
  actionTo?: string;
}

const emptyState: SetupState = {
  settings: {},
  domains: [],
  backups: null,
  overview: null,
};

function statusVariant(status: CheckStatus): 'green' | 'yellow' | 'red' {
  if (status === 'ok') return 'green';
  if (status === 'warn') return 'yellow';
  return 'red';
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'ok') return <CheckCircle2 size={17} className="text-emerald-400" />;
  if (status === 'warn') return <AlertTriangle size={17} className="text-yellow-400" />;
  return <XCircle size={17} className="text-red-400" />;
}

function CheckRow({ check }: { check: SetupCheck }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-5 py-4 last:border-0">
      <StatusIcon status={check.status} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-slate-100">{check.title}</h3>
          <Badge variant={statusVariant(check.status)}>{check.status}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-slate-400">{check.detail}</p>
      </div>
      {check.actionTo && check.actionLabel && (
        <Link
          to={check.actionTo}
          className="inline-flex items-center justify-center rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-600"
        >
          {check.actionLabel}
        </Link>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-3 truncate text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export function Setup() {
  const { error } = useToast();
  const [data, setData] = useState<SetupState>(emptyState);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, domains, backups, overview] = await Promise.all([
        getSettings(),
        listDomains(),
        listBackups(),
        getOverview(),
      ]);
      setData({ settings, domains, backups, overview });
    } catch (e) {
      error(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const apiOrigin = getAdminApiOrigin();
  const defaultDomain = data.settings.default_domain ?? '';
  const activeDomains = data.domains.filter((domain) => domain.status === 'active');
  const defaultCatalogDomain = data.domains.find((domain) => domain.is_default === 1);

  const checks = useMemo<SetupCheck[]>(() => {
    const defaultDomainKnown = !!defaultDomain.trim();
    const catalogHasDefault = !!defaultCatalogDomain;
    const defaultDomainRegistered = !defaultDomainKnown
      || data.domains.some((domain) => domain.domain === defaultDomain && domain.status === 'active');
    const apiReady = !!data.overview;

    return [
      {
        title: 'Worker API',
        detail: apiReady
          ? 'Authenticated API requests are responding'
          : 'Authenticated API requests are not responding',
        status: apiReady ? 'ok' : 'fail',
      },
      {
        title: 'Admin API origin',
        detail: apiOrigin,
        status: apiOrigin.startsWith('https://') || apiOrigin.startsWith('http://localhost') ? 'ok' : 'warn',
      },
      {
        title: 'Default short domain',
        detail: defaultDomainKnown ? defaultDomain : 'No default domain saved',
        status: defaultDomainKnown ? (defaultDomainRegistered ? 'ok' : 'warn') : 'warn',
        actionLabel: 'Open Settings',
        actionTo: '/settings',
      },
      {
        title: 'Domain catalog',
        detail: activeDomains.length > 0
          ? `${activeDomains.length.toLocaleString()} active domain${activeDomains.length === 1 ? '' : 's'}`
          : 'No active domains registered',
        status: activeDomains.length > 0 && catalogHasDefault ? 'ok' : 'warn',
        actionLabel: 'Open Domains',
        actionTo: '/domains',
      },
      {
        title: 'R2 backups',
        detail: data.backups?.r2Configured
          ? `${data.backups.total.toLocaleString()} backup record${data.backups.total === 1 ? '' : 's'}`
          : 'R2 backup binding is not available',
        status: data.backups?.r2Configured ? 'ok' : 'warn',
        actionLabel: 'Open Backups',
        actionTo: '/backups',
      },
      {
        title: 'First link',
        detail: data.overview && data.overview.totalLinks > 0
          ? `${data.overview.totalLinks.toLocaleString()} link${data.overview.totalLinks === 1 ? '' : 's'} created`
          : 'No links created yet',
        status: data.overview && data.overview.totalLinks > 0 ? 'ok' : 'warn',
        actionLabel: data.overview && data.overview.totalLinks > 0 ? 'Open Links' : 'Create Link',
        actionTo: data.overview && data.overview.totalLinks > 0 ? '/links' : '/links/create',
      },
    ];
  }, [activeDomains.length, apiOrigin, data, defaultCatalogDomain, defaultDomain]);

  const okCount = checks.filter((check) => check.status === 'ok').length;
  const failCount = checks.filter((check) => check.status === 'fail').length;
  const warnCount = checks.filter((check) => check.status === 'warn').length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Setup</h1>
          <p className="mt-0.5 text-sm text-slate-400">Instance status for this deployment</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={load} loading={loading}>
            Refresh
          </Button>
          <a
            href="https://github.com/everett7623/Linkora/blob/main/docs/SELF_HOSTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition-colors hover:bg-slate-600"
          >
            <ExternalLink size={15} /> Self-hosting
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Checks OK" value={okCount.toLocaleString()} icon={<CheckCircle2 size={17} className="text-emerald-400" />} />
        <Metric label="Warnings" value={warnCount.toLocaleString()} icon={<AlertTriangle size={17} className="text-yellow-400" />} />
        <Metric label="Failures" value={failCount.toLocaleString()} icon={<XCircle size={17} className="text-red-400" />} />
        <Metric label="API Origin" value={apiOrigin} icon={<ShieldCheck size={17} className="text-brand-400" />} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {checks.map((check) => <CheckRow key={check.title} check={check} />)}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/settings" className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
          <Settings size={18} className="text-brand-400" />
          <div className="mt-3 text-sm font-medium text-slate-100">Settings</div>
          <div className="mt-1 text-xs text-slate-500">{defaultDomain || 'No default domain'}</div>
        </Link>
        <Link to="/domains" className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
          <Globe2 size={18} className="text-emerald-400" />
          <div className="mt-3 text-sm font-medium text-slate-100">Domains</div>
          <div className="mt-1 text-xs text-slate-500">{activeDomains.length.toLocaleString()} active</div>
        </Link>
        <Link to="/links/create" className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
          <Link2 size={18} className="text-yellow-400" />
          <div className="mt-3 text-sm font-medium text-slate-100">Create Link</div>
          <div className="mt-1 text-xs text-slate-500">{data.overview?.totalLinks.toLocaleString() ?? '0'} total</div>
        </Link>
        <Link to="/backups" className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
          <Archive size={18} className="text-purple-400" />
          <div className="mt-3 text-sm font-medium text-slate-100">Backups</div>
          <div className="mt-1 text-xs text-slate-500">{data.backups?.r2Configured ? 'R2 ready' : 'R2 unavailable'}</div>
        </Link>
      </div>
    </div>
  );
}
