import { readBrowserSetting, writeBrowserSetting, type StorageLike } from './browserStorage.ts';

export type LinkView = 'table' | 'cards';

// Matches Tailwind's `md` breakpoint: below it the table needs sideways scrolling.
export const NARROW_LINK_VIEW_QUERY = '(max-width: 767px)';

export function normalizeLinkView(value: string | null | undefined): LinkView {
  return value === 'cards' ? 'cards' : 'table';
}

// Phones get cards until the operator picks a view; a stored choice always wins.
export function defaultLinkView(isNarrow: boolean): LinkView {
  return isNarrow ? 'cards' : 'table';
}

export function isNarrowLinkViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(NARROW_LINK_VIEW_QUERY).matches
  );
}

export function readLinkViewPreference(storage?: StorageLike, fallback: LinkView = 'table'): LinkView {
  try {
    const stored = readBrowserSetting('linkView', storage);
    return stored === 'cards' || stored === 'table' ? stored : fallback;
  } catch {
    return fallback;
  }
}

export function writeLinkViewPreference(view: LinkView, storage?: StorageLike): void {
  try {
    writeBrowserSetting('linkView', view, storage);
  } catch {
    // The in-memory view still changes when browser storage is unavailable.
  }
}
