import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Copy,
  ExternalLink,
  KeyRound,
  Pencil,
  Power,
  PowerOff,
  QrCode,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { Link as LinkType } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { buildShortUrl } from '../../utils/shortUrl';
import {
  getEffectiveLinkStatus,
  hasMaxClicks,
  isLinkExpiredByClicks,
  isLinkExpiredByTime,
  parseLinkTags,
} from '../../utils/linkPresentation';
import { StatusBadge } from '../ui/Badge';
import type { LinkCardAction } from './LinkCardActions';

interface LinkTableProps {
  links: LinkType[];
  defaultDomain: string;
  isAdvanced: boolean;
  selectedIds: ReadonlySet<string>;
  allVisibleSelected: boolean;
  onToggleSelected: (id: string) => void;
  onToggleAllVisible: () => void;
  onCopy: (link: LinkType) => void;
  onShowQr: (link: LinkType) => void;
  onConfirmAction: (action: LinkCardAction, link: LinkType) => void;
}

export function LinkTable({
  links,
  defaultDomain,
  isAdvanced,
  selectedIds,
  allVisibleSelected,
  onToggleSelected,
  onToggleAllVisible,
  onCopy,
  onShowQr,
  onConfirmAction,
}: LinkTableProps) {
  const { locale, t } = useLocale();
  const createdDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }),
    [locale]
  );
  const limitDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
            {isAdvanced && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleAllVisible}
                  aria-label={t('selectAllVisibleLinks')}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
                />
              </th>
            )}
            <th className="text-left px-4 py-3">{t('shortLink')}</th>
            <th className="text-left px-4 py-3">{t('destination')}</th>
            <th className="text-left px-4 py-3">{t('tags')}</th>
            <th className="text-right px-4 py-3">{t('clicks')}</th>
            {isAdvanced && <th className="text-left px-4 py-3">{t('limitsLabel')}</th>}
            <th className="text-left px-4 py-3">{t('status')}</th>
            <th className="text-left px-4 py-3">{t('created')}</th>
            {/* Actions stay pinned so long rows scroll underneath instead of clipping them. */}
            <th className="sticky right-0 bg-slate-900 shadow-[inset_1px_0_0_rgb(var(--color-slate-800))] text-right px-4 py-3 whitespace-nowrap">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {links.map((link) => {
            const tags = parseLinkTags(link.tags);
            const effectiveStatus = getEffectiveLinkStatus(link);
            const expiredByTime = isLinkExpiredByTime(link);
            const expiredByClicks = isLinkExpiredByClicks(link);
            return (
              <tr key={link.id} className="group hover:bg-slate-800/50 transition-colors">
                {isAdvanced && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(link.id)}
                      onChange={() => onToggleSelected(link.id)}
                      aria-label={t('selectLinkAria', { slug: link.slug })}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-brand-400">/{link.slug}</span>
                    {link.source && (
                      <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                        {link.source}
                      </span>
                    )}
                    {link.password_protected && (
                      <span title={t('passwordProtected')} className="inline-flex text-slate-500">
                        <KeyRound size={13} />
                      </span>
                    )}
                    {link.warning_enabled === 1 && (
                      <span title={t('safetyWarningEnabled')} className="inline-flex text-yellow-500">
                        <ShieldAlert size={13} />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[16rem]">
                  <p className="truncate text-slate-300" title={link.long_url}>
                    {link.long_url}
                  </p>
                  {link.title && <p className="text-xs text-slate-500 truncate">{link.title}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 3).map((tagName) => (
                      <span
                        key={tagName}
                        className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full"
                      >
                        {tagName}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-300 font-medium">
                  {link.clicks.toLocaleString(locale)}
                </td>
                {isAdvanced && (
                  <td className="px-4 py-3 text-xs">
                    {link.expires_at || hasMaxClicks(link) ? (
                      <div className="space-y-1">
                        {link.expires_at && (
                          <div className={expiredByTime ? 'text-yellow-400' : 'text-slate-500'}>
                            {t('until', {
                              date: limitDateFormatter.format(new Date(link.expires_at)),
                            })}
                          </div>
                        )}
                        {hasMaxClicks(link) && (
                          <div className={expiredByClicks ? 'text-yellow-400' : 'text-slate-500'}>
                            {link.clicks.toLocaleString(locale)} /{' '}
                            {Number(link.max_clicks).toLocaleString(locale)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">{t('none')}</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <StatusBadge status={effectiveStatus} />
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {createdDateFormatter.format(new Date(link.created_at))}
                </td>
                {/* The opaque pinned cell re-applies the row hover tint through an overlay. */}
                <td className="sticky right-0 bg-slate-900 shadow-[inset_1px_0_0_rgb(var(--color-slate-800))] px-4 py-3 before:pointer-events-none before:absolute before:inset-0 before:bg-slate-800/50 before:opacity-0 before:transition-opacity group-hover:before:opacity-100">
                  <div className="relative flex items-center justify-end gap-1">
                    <button
                      onClick={() => onCopy(link)}
                      title={t('copy')}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                    <a
                      href={buildShortUrl(link, defaultDomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t('open')}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => onShowQr(link)}
                      title={t('qrCode')}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                    >
                      <QrCode size={14} />
                    </button>
                    {isAdvanced && (
                      <Link
                        to={`/analytics/links/${link.id}`}
                        title={t('analytics')}
                        className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                      >
                        <BarChart3 size={14} />
                      </Link>
                    )}
                    <Link
                      to={`/links/${link.id}/edit`}
                      title={t('edit')}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Pencil size={14} />
                    </Link>
                    {link.status === 'active' ? (
                      <button
                        onClick={() => onConfirmAction('disable', link)}
                        title={t('disable')}
                        className="p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-slate-700 rounded transition-colors"
                      >
                        <PowerOff size={14} />
                      </button>
                    ) : link.status === 'disabled' ? (
                      <button
                        onClick={() => onConfirmAction('enable', link)}
                        title={t('enable')}
                        className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Power size={14} />
                      </button>
                    ) : null}
                    {isAdvanced &&
                      (link.archived === 0 ? (
                        <button
                          onClick={() => onConfirmAction('archive', link)}
                          title={t('archive')}
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Archive size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onConfirmAction('restore', link)}
                          title={t('restore')}
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ))}
                    <button
                      onClick={() => onConfirmAction('delete', link)}
                      title={t('delete')}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
