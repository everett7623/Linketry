import type { Link } from '@linkora/shared';

export function migratedShortUrl(targetDomain: string, slug: string): string {
  return `https://${targetDomain}/${slug}`;
}

export function domainMigrationSample(
  links: Link[],
  targetDomain: string
): Array<{ id: string; slug: string; current_short_url: string; next_short_url: string }> {
  return links.map((link) => ({
    id: link.id,
    slug: link.slug,
    current_short_url: link.short_url ?? `https://${link.domain}/${link.slug}`,
    next_short_url: migratedShortUrl(targetDomain, link.slug),
  }));
}
