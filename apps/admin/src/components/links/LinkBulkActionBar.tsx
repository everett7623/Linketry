import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Archive,
  ChevronDown,
  Power,
  PowerOff,
  Replace,
  RotateCcw,
  Tag,
  Trash2,
} from 'lucide-react';
import type { BulkLinkAction } from '../../api/links';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '../ui/Button';
import { focusFirst, trapTabKey } from '../../utils/focusTrap';

interface LinkBulkActionBarProps {
  selectedCount: number;
  loading: boolean;
  onAction: (action: BulkLinkAction) => void;
  onEditTags: () => void;
  onReplaceUrls: () => void;
}

type MenuKind = 'status' | 'organize' | null;

const menuItemClass =
  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50';

function BulkMenu({
  kind,
  open,
  label,
  loading,
  onToggle,
  onClose,
  children,
}: {
  kind: Exclude<MenuKind, null>;
  open: boolean;
  label: string;
  loading: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId().replace(/:/g, '');

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => focusFirst(menuRef.current));
    const onPointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        triggerRef.current?.focus();
        return;
      }
      trapTabKey(event, menuRef.current);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant="secondary"
        disabled={loading}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${kind}-${menuId}` : undefined}
        onClick={onToggle}
      >
        {label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Button>
      {open && (
        <div
          ref={menuRef}
          id={`${kind}-${menuId}`}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          className="absolute left-0 top-full z-40 mt-1 min-w-44 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function LinkBulkActionBar({
  selectedCount,
  loading,
  onAction,
  onEditTags,
  onReplaceUrls,
}: LinkBulkActionBarProps) {
  const { t } = useLocale();
  const [openMenu, setOpenMenu] = useState<MenuKind>(null);

  const run = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
      <span className="text-sm text-slate-300">{t('selectedCount', { count: selectedCount })}</span>
      <div className="flex flex-wrap items-center gap-2">
        <BulkMenu
          kind="status"
          open={openMenu === 'status'}
          label={t('bulkStatusActions')}
          loading={loading}
          onToggle={() => setOpenMenu((current) => (current === 'status' ? null : 'status'))}
          onClose={() => setOpenMenu(null)}
        >
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            className={menuItemClass}
            onClick={() => run(() => onAction('disable'))}
          >
            <PowerOff size={14} aria-hidden="true" />
            {t('disable')}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            className={menuItemClass}
            onClick={() => run(() => onAction('enable'))}
          >
            <Power size={14} aria-hidden="true" />
            {t('enable')}
          </button>
        </BulkMenu>

        <BulkMenu
          kind="organize"
          open={openMenu === 'organize'}
          label={t('bulkOrganizeActions')}
          loading={loading}
          onToggle={() => setOpenMenu((current) => (current === 'organize' ? null : 'organize'))}
          onClose={() => setOpenMenu(null)}
        >
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            className={menuItemClass}
            onClick={() => run(() => onAction('archive'))}
          >
            <Archive size={14} aria-hidden="true" />
            {t('archive')}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            className={menuItemClass}
            onClick={() => run(() => onAction('restore'))}
          >
            <RotateCcw size={14} aria-hidden="true" />
            {t('restore')}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            className={menuItemClass}
            onClick={() => run(onEditTags)}
          >
            <Tag size={14} aria-hidden="true" />
            {t('tags')}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            className={menuItemClass}
            onClick={() => run(onReplaceUrls)}
          >
            <Replace size={14} aria-hidden="true" />
            {t('replaceUrls')}
          </button>
        </BulkMenu>

        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 size={14} />}
          onClick={() => onAction('delete')}
          loading={loading}
        >
          {t('delete')}
        </Button>
      </div>
    </div>
  );
}
