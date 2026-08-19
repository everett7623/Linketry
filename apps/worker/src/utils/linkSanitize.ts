import type { Link } from '@linketry/shared';

/**
 * Strips the stored password hash before a link leaves the API.
 * Only backup/restore payloads may carry the hash, and those require admin scope.
 */
export function sanitizeLink(link: Link): Link {
  return {
    ...link,
    password_hash: null,
    password_protected: !!link.password_hash,
  };
}

export function sanitizeLinks(items: Link[]): Link[] {
  return items.map(sanitizeLink);
}
