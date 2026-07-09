import { getApiBase } from './client';

export function getAdminApiOrigin(): string {
  return getApiBase() || window.location.origin;
}
