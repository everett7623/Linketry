/**
 * User-Agent classification shared by visit analytics and smart redirect rules.
 *
 * Kept in one place so a request cannot be recorded as one device while a
 * redirect rule matches another. Order matters: modern Opera and Edge user
 * agents both contain `Chrome`.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function detectDevice(ua: string): DeviceType {
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  return 'desktop';
}

/** Canonical lowercase browser id (used for redirect-rule matching). */
export function detectBrowserId(ua: string): string {
  if (/Edg\//i.test(ua)) return 'edge';
  if (/OPR\/|Opera/i.test(ua)) return 'opera';
  if (/Firefox\//i.test(ua)) return 'firefox';
  if (/Chrome\//i.test(ua)) return 'chrome';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'safari';
  if (/MSIE|Trident/i.test(ua)) return 'ie';
  return 'other';
}

const BROWSER_LABELS: Record<string, string> = {
  edge: 'Edge',
  opera: 'Opera',
  firefox: 'Firefox',
  chrome: 'Chrome',
  safari: 'Safari',
  ie: 'IE',
  other: 'Other',
};

/** Title-case browser label (stored on `visits.browser`). */
export function detectBrowserLabel(ua: string): string {
  return BROWSER_LABELS[detectBrowserId(ua)] ?? 'Other';
}

export function detectOS(ua: string): string {
  if (/Windows/i.test(ua)) return 'Windows';
  // Mobile OS tokens first: iOS user agents contain "like Mac OS X" and Android
  // user agents contain "Linux", so the desktop families must be checked after.
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}
