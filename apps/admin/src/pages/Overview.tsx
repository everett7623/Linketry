import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, MousePointerClick, TrendingUp, Plus, ExternalLink, Copy } from 'lucide-react';
import { getOverview } from '../api/links';
import { getSettings } from '../api/settings';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { BrandMark } from '../components/BrandMark';
import { buildShortUrl } from '../utils/shortUrl';
import type { Link as LinkType } from '@linketry/shared';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useLocale } from '../contexts/LocaleContext';
import { copyToClipboard } from '../utils/clipboard';

dayjs.extend(relativeTime);

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const { locale } = useLocale();
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-100">
        {typeof value === 'number' ? value.toLocaleString(locale) : value}
      </div>
    </div>
  );
}

function LinkRow({ link, defaultDomain }: { link: LinkType; defaultDomain: string }) {
  const { success, error } = useToast();
  const { locale, t } = useLocale();
  const shortUrl = buildShortUrl(link, defaultDomain);
  const copy = async () => {
    if (await copyToClipboard(shortUrl)) success(t('copiedClipboard'));
    else error(t('copyFailed'));
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-brand-400">/{link.slug}</span>
          <StatusBadge status={link.status} />
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{link.long_url}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium text-slate-300">
          {t('clicksCount', { count: link.clicks.toLocaleString(locale) })}
        </div>
        <div className="text-xs text-slate-600">
          {dayjs(link.created_at)
            .locale(locale === 'zh-CN' ? 'zh-cn' : 'en')
            .fromNow()}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={copy}
          aria-label={t('copyShortLinkAria', { slug: link.slug })}
          title={t('copyShortLinkAria', { slug: link.slug })}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Copy size={14} aria-hidden="true" />
        </button>
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('openShortLinkAria', { slug: link.slug })}
          title={t('openShortLinkAria', { slug: link.slug })}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function Overview() {
  const [stats, setStats] = useState<{
    totalLinks: number;
    totalClicks: number;
    todayClicks: number;
    recentLinks: LinkType[];
    topLinks: LinkType[];
  } | null>(null);
  const [defaultDomain, setDefaultDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const { error } = useToast();
  const { t } = useLocale();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getOverview(), getSettings()])
      .then(([overview, settings]) => {
        setStats(overview);
        setDefaultDomain(settings.default_domain ?? '');
      })
      .catch(() => error(t('overviewLoadFailed')))
      .finally(() => setLoading(false));
  }, [error, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">{t('overview')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('dashboardSubtitle')}</p>
          {defaultDomain ? (
            <p className="mt-2 font-mono text-xs text-brand-400/90">
              {t('overviewDomainLabel', { domain: defaultDomain })}
            </p>
          ) : null}
        </div>
        <Button
          icon={<Plus size={16} aria-hidden="true" />}
          onClick={() => navigate('/links/create')}
        >
          {t('createLink')}
        </Button>
      </div>

      {(stats?.totalLinks ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-10 text-center">
          <div className="mx-auto mb-4 w-fit rounded-2xl shadow-lg shadow-brand-600/20">
            <BrandMark size="md" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">{t('overviewEmptyTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{t('overviewEmptyHint')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              icon={<Plus size={16} aria-hidden="true" />}
              onClick={() => navigate('/links/create')}
            >
              {t('createLink')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/setup')}>
              {t('setup')}
            </Button>
          </div>
        </div>
      )}

      {/* Stats — Operator Indigo wells only (One Voice); status hues stay on badges/data. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('totalLinks')}
          value={stats?.totalLinks ?? 0}
          icon={<Link2 size={16} className="text-brand-400" />}
          color="bg-brand-500/10"
        />
        <StatCard
          label={t('totalClicks')}
          value={stats?.totalClicks ?? 0}
          icon={<MousePointerClick size={16} className="text-brand-400" />}
          color="bg-brand-500/10"
        />
        <StatCard
          label={t('todayClicks')}
          value={stats?.todayClicks ?? 0}
          icon={<TrendingUp size={16} className="text-brand-400" />}
          color="bg-brand-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">{t('recentlyCreated')}</h2>
            <Link to="/links" className="text-xs text-brand-400 hover:text-brand-300">
              {t('viewAll')}
            </Link>
          </div>
          {stats?.recentLinks.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              {t('noLinksYet')}{' '}
              <Link
                to="/links/create"
                className="text-brand-400 underline decoration-current underline-offset-2"
              >
                {t('createOne')}
              </Link>
            </p>
          ) : (
            stats?.recentLinks.map((l) => (
              <LinkRow key={l.id} link={l} defaultDomain={defaultDomain} />
            ))
          )}
        </div>

        {/* Top Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">{t('topLinks')}</h2>
            <Link
              to="/links?sort=clicks_desc"
              className="text-xs text-brand-400 hover:text-brand-300"
            >
              {t('viewAll')}
            </Link>
          </div>
          {stats?.topLinks.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">{t('noClicksYet')}</p>
          ) : (
            stats?.topLinks.map((l) => (
              <LinkRow key={l.id} link={l} defaultDomain={defaultDomain} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
