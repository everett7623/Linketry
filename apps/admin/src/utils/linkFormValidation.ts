import { isReservedSlug, validateDomain, validateLongUrl, validateSlug } from '@linketry/shared';
import type { MessageKey } from '../i18n/messages';

/**
 * Reuses the same validators the Worker enforces so the forms cannot accept
 * input the API will reject. Returns a localizable key, not the English text
 * the validators produce.
 */
export function slugErrorKey(slug: string): MessageKey | null {
  if (!slug) return null;
  if (validateSlug(slug).valid) return null;
  if (isReservedSlug(slug)) return 'reservedSlug';
  if (slug.length > 100) return 'slugTooLong';
  return 'invalidSlug';
}

export function longUrlErrorKey(url: string): MessageKey | null {
  const trimmed = url.trim();
  if (!trimmed) return 'destinationRequired';
  return validateLongUrl(trimmed).valid ? null : 'invalidHttpUrl';
}

export function domainErrorKey(domain: string): MessageKey | null {
  const trimmed = domain.trim();
  if (!trimmed) return null;
  return validateDomain(trimmed).valid ? null : 'invalidDomain';
}
