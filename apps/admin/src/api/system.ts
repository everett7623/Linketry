const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function getAdminApiOrigin(): string {
  return API_BASE || window.location.origin;
}
