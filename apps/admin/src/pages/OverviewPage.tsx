import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api/client';
import { Link2, MousePointerClick, TrendingUp, Clock } from 'lucide-react';
import type { Link as LinkType, OverviewStats } from '@linkora/shared';
import dayjs from 'dayjs';

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<OverviewStats>('/api/overview')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-slate-400">Failed to load overview data.</p>;
  }

  const cards = [
    { label: 'Total Links', value: stats.totalLinks, icon: Link2, color: 'text-brand-400' },
    { label: 'Total Clicks', value: stats.totalClicks, icon: MousePointerClick, color: 'text-emerald-400' },
    { label: 'Today Clicks', value: stats.todayClicks, icon: TrendingUp, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Overview</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <c.icon className={`h-5 w-5 ${c.color}`} />
              <span className="text-sm text-slate-400">{c.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Recent + Top Links */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LinkTable title="Recent Links" icon={<Clock className="h-4 w-4 text-slate-400" />} links={stats.recentLinks} />
        <LinkTable title="Top Links" icon={<TrendingUp className="h-4 w-4 text-slate-400" />} links={stats.topLinks} />
      </div>
    </div>
  );
}

function LinkTable({ title, icon, links }: { title: string; icon: React.ReactNode; links: LinkType[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        {icon}
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {links.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">No links yet</p>
      ) : (
        <div className="divide-y divide-slate-800">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-400">/{link.slug}</p>
                <p className="truncate text-xs text-slate-500">{link.long_url}</p>
              </div>
              <div className="ml-4 flex flex-col items-end text-xs">
                <span className="font-medium text-slate-300">{link.clicks} clicks</span>
                <span className="text-slate-500">{dayjs(link.created_at).format('MM/DD HH:mm')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-slate-800 px-4 py-2">
        <Link to="/links" className="text-xs font-medium text-brand-400 hover:text-brand-300">
          View all links &rarr;
        </Link>
      </div>
    </div>
  );
}
