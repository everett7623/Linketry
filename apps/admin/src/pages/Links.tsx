import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  listLinks,
  deleteLink,
  disableLink,
  enableLink,
  archiveLink,
  restoreLink,
  bulkLinkAction,
  type BulkLinkAction,
} from '../api/links';
import { getSettings } from '../api/settings';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { buildShortUrl } from '../utils/shortUrl';
import type { Link as LinkType, PaginatedResult } from '@linketry/shared';
import { useAdminMode } from '../contexts/AdminModeContext';
import { stripAdvancedLinkFilters } from '../utils/linkFilters';
import { useLocale } from '../contexts/LocaleContext';
import { BulkTagModal } from '../components/links/BulkTagModal';
import { BulkUrlReplaceModal } from '../components/links/BulkUrlReplaceModal';
import { DomainMigrationModal } from '../components/links/DomainMigrationModal';
import { LinkAdvancedFilters } from '../components/links/LinkAdvancedFilters';
import { LinkBulkActionBar } from '../components/links/LinkBulkActionBar';
import { LinkCardGrid } from '../components/links/LinkCardGrid';
import {
  BulkActionConfirmDialog,
  LinkActionConfirmDialog,
} from '../components/links/LinkConfirmDialogs';
import { LinkFilterBar } from '../components/links/LinkFilterBar';
import { LinkTable } from '../components/links/LinkTable';
import { LinkViewToolbar } from '../components/links/LinkViewToolbar';
import { QrCodeModal, type LinkQrCode } from '../components/links/QrCodeModal';
import { readLinkViewPreference, writeLinkViewPreference, type LinkView } from '../utils/linkView';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function normalizePageParam(value: string | null): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function Links() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResult<LinkType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultDomain, setDefaultDomain] = useState('');
  const [confirm, setConfirm] = useState<{ type: string; link: LinkType } | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<BulkLinkAction | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qr, setQr] = useState<LinkQrCode | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [domainMigrationOpen, setDomainMigrationOpen] = useState(false);
  const [linkView, setLinkView] = useState<LinkView>(readLinkViewPreference);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('keyword') ?? '');
  const { success, error } = useToast();
  const { isAdvanced } = useAdminMode();
  const { locale, t } = useLocale();
  const loadRequestIdRef = useRef(0);

  const keyword = searchParams.get('keyword') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const status = searchParams.get('status') ?? '';
  const source = searchParams.get('source') ?? '';
  const domain = searchParams.get('domain') ?? '';
  const createdFrom = searchParams.get('createdFrom') ?? '';
  const createdTo = searchParams.get('createdTo') ?? '';
  const hasPassword = searchParams.get('hasPassword') ?? '';
  const warning = searchParams.get('warning') ?? '';
  const limits = searchParams.get('limits') ?? '';
  const sort = searchParams.get('sort') ?? 'created_at_desc';
  const page = normalizePageParam(searchParams.get('page'));

  const changeLinkView = (view: LinkView) => {
    setLinkView(view);
    writeLinkViewPreference(view);
  };

  const load = useCallback(async () => {
    // Filters can change faster than the API responds; only the newest result may win.
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    try {
      const data = await listLinks({
        keyword,
        tag,
        status,
        source,
        domain,
        createdFrom,
        createdTo,
        hasPassword,
        warning,
        limits,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== loadRequestIdRef.current) return;
      setResult(data);
    } catch (e) {
      if (requestId !== loadRequestIdRef.current) return;
      error(formatApiErrorMessage(e, t));
    } finally {
      if (requestId === loadRequestIdRef.current) setLoading(false);
    }
  }, [
    keyword,
    tag,
    status,
    source,
    domain,
    createdFrom,
    createdTo,
    hasPassword,
    warning,
    limits,
    sort,
    page,
    t,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    keyword,
    tag,
    status,
    source,
    domain,
    createdFrom,
    createdTo,
    hasPassword,
    warning,
    limits,
    sort,
    page,
  ]);

  useEffect(() => {
    getSettings()
      .then((s) => setDefaultDomain(s.default_domain ?? ''))
      .catch(() => undefined);
  }, []);

  // Keep the field responsive while collapsing a burst of keystrokes into one query,
  // and replace history entries so Back leaves the page instead of replaying each letter.
  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  useEffect(() => {
    if (searchInput === keyword) return;
    const timer = window.setTimeout(() => setParam('keyword', searchInput, true), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    if (isAdvanced) return;
    const next = stripAdvancedLinkFilters(searchParams);
    if (next) setSearchParams(next, { replace: true });
  }, [isAdvanced, searchParams, setSearchParams]);

  const setParam = (key: string, value: string, replace = false) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') p.delete('page');
    setSearchParams(p, { replace });
  };

  const clearFilters = () => {
    const p = new URLSearchParams();
    if (sort) p.set('sort', sort);
    setSearchParams(p);
  };

  const copyLink = async (link: LinkType) => {
    try {
      await navigator.clipboard.writeText(buildShortUrl(link, defaultDomain));
      success(t('copied'));
    } catch {
      error(t('copyFailed'));
    }
  };

  const showQr = (link: LinkType) => {
    setQr({ link, url: buildShortUrl(link, defaultDomain) });
  };

  const runAction = async (type: string, link: LinkType) => {
    setActionLoading(true);
    try {
      if (type === 'delete') {
        await deleteLink(link.id);
        success(t('linkDeleted'));
      } else if (type === 'disable') {
        await disableLink(link.id);
        success(t('linkDisabled'));
      } else if (type === 'enable') {
        await enableLink(link.id);
        success(t('linkEnabled'));
      } else if (type === 'archive') {
        await archiveLink(link.id);
        success(t('linkArchived'));
      } else if (type === 'restore') {
        await restoreLink(link.id);
        success(t('linkRestored'));
      }
      await load();
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const confirmAction = (type: string, link: LinkType) => {
    if (type === 'disable' || type === 'archive') {
      setConfirm({ type, link });
    } else if (type === 'delete') {
      setConfirm({ type, link });
    } else {
      runAction(type, link);
    }
  };

  const visibleIds = result?.items.map((link) => link.id) ?? [];
  const selectedCount = selectedIds.size;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const runBulkAction = async (action: BulkLinkAction) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setActionLoading(true);
    try {
      const result = await bulkLinkAction(ids, action);
      success(t('bulkUpdated', { action: t(action), count: result.success }));
      setSelectedIds(new Set());
      await load();
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setActionLoading(false);
      setBulkConfirm(null);
    }
  };

  const requestBulkAction = (action: BulkLinkAction) => {
    if (selectedCount === 0) return;
    if (action === 'delete' || action === 'archive' || action === 'disable') {
      setBulkConfirm(action);
      return;
    }
    runBulkAction(action);
  };

  const openTagModal = () => {
    if (selectedCount === 0) return;
    setTagModalOpen(true);
  };

  const clearSelectionAndReload = async () => {
    setSelectedIds(new Set());
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('linksList')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {result ? t('linksCount', { count: result.total.toLocaleString(locale) }) : '—'}
          </p>
        </div>
        <Link to="/links/create">
          <Button icon={<Plus size={16} />}>{t('createLink')}</Button>
        </Link>
      </div>

      <LinkFilterBar
        searchInput={searchInput}
        status={status}
        sort={sort}
        onSearchInputChange={setSearchInput}
        onParamChange={setParam}
      />

      {isAdvanced && (
        <LinkAdvancedFilters
          values={{ tag, source, domain, hasPassword, warning, limits, createdFrom, createdTo }}
          selectedIds={[...selectedIds]}
          filteredCount={result?.total ?? 0}
          searchParams={searchParams}
          onParamChange={setParam}
          onClear={clearFilters}
          onOpenDomainMigration={() => setDomainMigrationOpen(true)}
          onBulkUtmCompleted={clearSelectionAndReload}
        />
      )}

      {isAdvanced && selectedCount > 0 && (
        <LinkBulkActionBar
          selectedCount={selectedCount}
          loading={actionLoading}
          onAction={requestBulkAction}
          onEditTags={openTagModal}
          onReplaceUrls={() => setReplaceOpen(true)}
        />
      )}

      <LinkViewToolbar
        view={linkView}
        showSelectAll={isAdvanced && linkView === 'cards' && visibleIds.length > 0}
        allVisibleSelected={allVisibleSelected}
        onChange={changeLinkView}
        onToggleAllVisible={toggleAllVisible}
      />

      {/* Link results */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : result?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-slate-400">{t('noLinksFound')}</p>
            <Link to="/links/create">
              <Button size="sm" icon={<Plus size={14} />}>
                {t('createFirstLink')}
              </Button>
            </Link>
          </div>
        ) : linkView === 'cards' ? (
          <LinkCardGrid
            links={result?.items ?? []}
            defaultDomain={defaultDomain}
            isAdvanced={isAdvanced}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            onCopy={copyLink}
            onShowQr={showQr}
            onConfirmAction={confirmAction}
          />
        ) : (
          <LinkTable
            links={result?.items ?? []}
            defaultDomain={defaultDomain}
            isAdvanced={isAdvanced}
            selectedIds={selectedIds}
            allVisibleSelected={allVisibleSelected}
            onToggleSelected={toggleSelected}
            onToggleAllVisible={toggleAllVisible}
            onCopy={copyLink}
            onShowQr={showQr}
            onConfirmAction={confirmAction}
          />
        )}
      </div>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{t('pageOf', { page, total: result.totalPages })}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={14} />}
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              {t('previous')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= result.totalPages}
              onClick={() => setParam('page', String(page + 1))}
            >
              {t('next')} <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <LinkActionConfirmDialog
        confirm={confirm}
        loading={actionLoading}
        onClose={() => setConfirm(null)}
        onConfirm={runAction}
      />

      {isAdvanced && (
        <BulkActionConfirmDialog
          action={bulkConfirm}
          selectedCount={selectedCount}
          loading={actionLoading}
          onClose={() => setBulkConfirm(null)}
          onConfirm={runBulkAction}
        />
      )}

      {isAdvanced && tagModalOpen && (
        <BulkTagModal
          selectedIds={[...selectedIds]}
          onClose={() => setTagModalOpen(false)}
          onCompleted={async () => {
            setTagModalOpen(false);
            await clearSelectionAndReload();
          }}
        />
      )}

      {isAdvanced && (
        <BulkUrlReplaceModal
          open={replaceOpen}
          selectedIds={[...selectedIds]}
          onClose={() => setReplaceOpen(false)}
          onCompleted={async () => {
            setReplaceOpen(false);
            await clearSelectionAndReload();
          }}
        />
      )}

      {isAdvanced && domainMigrationOpen && (
        <DomainMigrationModal
          initialSourceDomain={domain}
          initialTargetDomain={defaultDomain}
          onClose={() => setDomainMigrationOpen(false)}
          onCompleted={async () => {
            setDomainMigrationOpen(false);
            await load();
          }}
        />
      )}

      <QrCodeModal qr={qr} onClose={() => setQr(null)} onCopy={copyLink} />
    </div>
  );
}
