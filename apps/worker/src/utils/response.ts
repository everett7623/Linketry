import type { ApiResponse } from '@linkora/shared';

export function jsonOk<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonError(error: string, status = 400): Response {
  const body: ApiResponse = { success: false, error };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonCreated<T>(data: T): Response {
  return jsonOk(data, 201);
}

export function notFound(message = 'Not Found'): Response {
  return new Response(renderNotFoundPage(message), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function disabledPage(): Response {
  return new Response(renderDisabledPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function expiredPage(): Response {
  return new Response(renderExpiredPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function passwordPage(slug: string, invalid = false): Response {
  return new Response(renderPasswordPage(slug, invalid), {
    status: invalid ? 401 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function warningPage(
  slug: string,
  longUrl: string,
  requiresPassword = false
): Response {
  return new Response(renderWarningPage(slug, longUrl, requiresPassword), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNotFoundPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Link Not Found | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    .code { font-size: 6rem; font-weight: 800; color: #6366f1; line-height: 1; }
    h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; }
    a { color: #6366f1; text-decoration: none; margin-top: 1.5rem; display: inline-block; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">404</div>
    <h1>Link Not Found</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function renderDisabledPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Disabled | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>Link Disabled</h1>
    <p>This link has been disabled and is no longer accessible.</p>
  </div>
</body>
</html>`;
}

function renderPasswordPage(slug: string, invalid: boolean): string {
  const safeSlug = escapeHtml(slug);
  const error = invalid ? '<p class="error">Incorrect password. Try again.</p>' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Required | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { width: min(28rem, calc(100vw - 2rem)); padding: 2rem; }
    .panel { border: 1px solid #334155; background: #111827; border-radius: 12px; padding: 1.5rem; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #f8fafc; }
    p { color: #94a3b8; line-height: 1.5; }
    label { display: block; color: #cbd5e1; font-size: 0.875rem; margin: 1rem 0 0.375rem; }
    input { width: 100%; border: 1px solid #475569; border-radius: 8px; padding: 0.75rem; color: #f8fafc; background: #020617; font-size: 1rem; }
    button { width: 100%; margin-top: 1rem; border: 0; border-radius: 8px; padding: 0.75rem 1rem; color: white; background: #4f46e5; font-weight: 600; cursor: pointer; }
    button:hover { background: #4338ca; }
    .slug { color: #818cf8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .error { color: #f87171; margin-top: 0.75rem; font-size: 0.875rem; }
  </style>
</head>
<body>
  <main class="container">
    <section class="panel">
      <h1>Password Required</h1>
      <p>Enter the password to continue to <span class="slug">/${safeSlug}</span>.</p>
      ${error}
      <form method="post" action="/${safeSlug}">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
        <button type="submit">Continue</button>
      </form>
    </section>
  </main>
</body>
</html>`;
}

function renderWarningPage(slug: string, longUrl: string, requiresPassword: boolean): string {
  const safeSlug = escapeHtml(slug);
  const safeUrl = escapeHtml(longUrl);
  const action = `/${encodeURIComponent(slug)}?linkora_confirm=1`;
  const continueControl = requiresPassword
    ? `<form method="post" action="${escapeHtml(action)}">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required>
        <button type="submit">Continue</button>
      </form>`
    : `<a class="button" href="${escapeHtml(action)}">Continue</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Continue to External Site | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { width: min(34rem, calc(100vw - 2rem)); padding: 2rem; }
    .panel { border: 1px solid #334155; background: #111827; border-radius: 12px; padding: 1.5rem; }
    .label { color: #f59e0b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 0.75rem; }
    h1 { font-size: 1.35rem; color: #f8fafc; margin-bottom: 0.5rem; }
    p { color: #94a3b8; line-height: 1.5; }
    .url { margin: 1rem 0; padding: 0.75rem; border: 1px solid #334155; border-radius: 8px; color: #cbd5e1; background: #020617; overflow-wrap: anywhere; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.875rem; }
    .actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    label { display: block; color: #cbd5e1; font-size: 0.875rem; margin-bottom: 0.375rem; }
    input { width: 100%; border: 1px solid #475569; border-radius: 8px; padding: 0.75rem; color: #f8fafc; background: #020617; font-size: 1rem; margin-bottom: 0.75rem; }
    .button, button { display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; padding: 0.75rem 1rem; color: white; background: #4f46e5; font-weight: 600; text-decoration: none; cursor: pointer; }
    .button:hover, button:hover { background: #4338ca; }
    .slug { color: #818cf8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  </style>
</head>
<body>
  <main class="container">
    <section class="panel">
      <div class="label">External destination</div>
      <h1>Continue from <span class="slug">/${safeSlug}</span>?</h1>
      <p>This short link is configured to show a safety confirmation before opening the destination.</p>
      <div class="url">${safeUrl}</div>
      <div class="actions">
        ${continueControl}
      </div>
    </section>
  </main>
</body>
</html>`;
}

function renderExpiredPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    .code { font-size: 4rem; font-weight: 800; color: #f59e0b; line-height: 1; }
    h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">Expired</div>
    <h1>Link Expired</h1>
    <p>This link has reached its expiry condition and is no longer accessible.</p>
  </div>
</body>
</html>`;
}
