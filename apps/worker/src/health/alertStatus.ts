import type { HealthAlertState } from './alertPolicy';

interface AlertLink {
  id: string;
  slug: string;
  domain?: string | null;
  fallback_url?: string | null;
}

export function buildHealthAlertStatus(state: HealthAlertState, links: AlertLink[]) {
  const linkById = new Map(links.map((link) => [link.id, link]));
  const alerted = new Set(state.alerted);
  return {
    items: Object.keys(state.failures)
      .map((id) => {
        const link = linkById.get(id);
        return {
          link_id: id,
          slug: link?.slug ?? null,
          domain: link?.domain ?? null,
          fallback_url: link?.fallback_url ?? null,
          consecutive_failures: state.failures[id],
          alerted: alerted.has(id),
        };
      })
      .sort((a, b) => b.consecutive_failures - a.consecutive_failures),
    last_alert_at: state.lastAlertAt ?? null,
  };
}
