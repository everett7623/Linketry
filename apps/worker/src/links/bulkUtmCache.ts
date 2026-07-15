export function bulkUtmCacheTargets(
  links: Array<{ slug: string; domain?: string | null }>,
  fallbackDomain: string
): Array<{ domain: string; slug: string }> {
  return links.map((link) => ({
    domain: link.domain?.trim() || fallbackDomain,
    slug: link.slug,
  }));
}
