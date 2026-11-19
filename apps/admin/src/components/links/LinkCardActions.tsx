import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  QrCode,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { Link as LinkType } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { focusFirst, trapTabKey } from '../../utils/focusTrap';

export type LinkCardAction = 'archive' | 'delete' | 'disable' | 'enable' | 'restore';

interface LinkCardActionsProps {
  link: LinkType;
  shortUrl: string;
  isAdvanced: boolean;
  onCopy: (link: LinkType) => void;
  onShowQr: (link: LinkType) => void;
  onConfirmAction: (action: LinkCardAction, link: LinkType) => void;
}

const primaryClass =
  'inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500';

const menuItemClass =
  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500';

export function LinkCardActions({
  link,
  shortUrl,
  isAdvanced,
  onCopy,
  onShowQr,
  onConfirmAction,
}: LinkCardActionsProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId().replace(/:/g, '');
  const moreLabel = t('moreLinkActions', { slug: link.slug });

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => focusFirst(menuRef.current));
    const onPointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
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
  }, [open]);

  const closeAnd = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onCopy(link)}
        aria-label={t('copy')}
        title={t('copy')}
        className={primaryClass}
      >
        <Copy size={14} aria-hidden="true" />
      </button>
      <Link
        to={`/links/${link.id}/edit`}
        aria-label={t('edit')}
        title={t('edit')}
        className={primaryClass}
      >
        <Pencil size={14} aria-hidden="true" />
      </Link>

      <button
        ref={triggerRef}
        type="button"
        aria-label={moreLabel}
        title={moreLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={primaryClass}
      >
        <MoreHorizontal size={14} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={moreLabel}
          tabIndex={-1}
          className="absolute right-0 top-full z-40 mt-1 min-w-44 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"
        >
          <a
            role="menuitem"
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={menuItemClass}
            onClick={() => setOpen(false)}
          >
            <ExternalLink size={14} aria-hidden="true" />
            {t('open')}
          </a>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => closeAnd(() => onShowQr(link))}
          >
            <QrCode size={14} aria-hidden="true" />
            {t('qrCode')}
          </button>
          {isAdvanced && (
            <Link
              role="menuitem"
              to={`/analytics/links/${link.id}`}
              className={menuItemClass}
              onClick={() => setOpen(false)}
            >
              <BarChart3 size={14} aria-hidden="true" />
              {t('analytics')}
            </Link>
          )}

          <div className="my-1 border-t border-slate-800" role="separator" />

          {link.status === 'active' && (
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={() => closeAnd(() => onConfirmAction('disable', link))}
            >
              <PowerOff size={14} aria-hidden="true" />
              {t('disable')}
            </button>
          )}
          {link.status === 'disabled' && (
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={() => closeAnd(() => onConfirmAction('enable', link))}
            >
              <Power size={14} aria-hidden="true" />
              {t('enable')}
            </button>
          )}
          {isAdvanced &&
            (link.archived === 0 ? (
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => closeAnd(() => onConfirmAction('archive', link))}
              >
                <Archive size={14} aria-hidden="true" />
                {t('archive')}
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => closeAnd(() => onConfirmAction('restore', link))}
              >
                <RotateCcw size={14} aria-hidden="true" />
                {t('restore')}
              </button>
            ))}

          <div className="my-1 border-t border-slate-800" role="separator" />

          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass} text-red-300 hover:bg-red-950/40 hover:text-red-200`}
            onClick={() => closeAnd(() => onConfirmAction('delete', link))}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t('delete')}
          </button>
        </div>
      )}
    </div>
  );
}
