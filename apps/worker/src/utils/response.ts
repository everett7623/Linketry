import {
  renderDisabledPage,
  renderExpiredPage,
  renderNotFoundPage,
  renderPasswordPage,
  renderWarningPage,
  type PublicLocale,
  type PublicPageTemplate,
} from './publicPages';
export { jsonCreated, jsonError, jsonOk } from './jsonResponse';

const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8', Vary: 'Accept-Language' };

export function notFound(message?: string, locale: PublicLocale = 'en'): Response {
  return new Response(renderNotFoundPage(locale, message), { status: 404, headers: htmlHeaders });
}

export function disabledPage(locale: PublicLocale = 'en', template?: PublicPageTemplate): Response {
  return new Response(renderDisabledPage(locale, template), { status: 200, headers: htmlHeaders });
}

export function expiredPage(locale: PublicLocale = 'en', template?: PublicPageTemplate): Response {
  return new Response(renderExpiredPage(locale, template), { status: 200, headers: htmlHeaders });
}

export function passwordPage(slug: string, invalid = false, locale: PublicLocale = 'en'): Response {
  return new Response(renderPasswordPage(locale, slug, invalid), {
    status: invalid ? 401 : 200,
    headers: htmlHeaders,
  });
}

export function warningPage(
  slug: string,
  longUrl: string,
  requiresPassword = false,
  locale: PublicLocale = 'en',
  template?: PublicPageTemplate
): Response {
  return new Response(renderWarningPage(locale, slug, longUrl, requiresPassword, template), {
    status: 200,
    headers: htmlHeaders,
  });
}
