import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';
import { registerHooks } from 'node:module';
import test from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !extname(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { fetchBoundedHtml } = await import('./htmlInspect.ts');

const originalFetch = globalThis.fetch;

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

test('rejects egress to private hosts without fetching', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response('', { status: 200 });
  };
  try {
    const result = await fetchBoundedHtml('http://127.0.0.1/', { userAgent: 'test' });
    assert.equal(result.ok, false);
    assert.equal(called, false);
  } finally {
    restoreFetch();
  }
});

test('caps the response body at maxBytes even without Content-Length', async () => {
  const hugeChunk = new Uint8Array(64 * 1024).fill(97); // 'a'
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        pull(controller) {
          controller.enqueue(hugeChunk);
        },
      }),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );

  try {
    const result = await fetchBoundedHtml('https://example.com/', {
      userAgent: 'test',
      maxBytes: 100 * 1024,
    });
    assert.equal(result.ok, true);
    const text = await result.response.text();
    assert.ok(text.length <= 100 * 1024, `expected <= 100KiB, got ${text.length}`);
  } finally {
    restoreFetch();
  }
});

test('rejects non-HTML content types', async () => {
  globalThis.fetch = async () =>
    new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    const result = await fetchBoundedHtml('https://example.com/data.json', { userAgent: 'test' });
    assert.equal(result.ok, false);
  } finally {
    restoreFetch();
  }
});

test('rejects an oversized declared Content-Length', async () => {
  globalThis.fetch = async () =>
    new Response('<title>x</title>', {
      status: 200,
      headers: { 'Content-Type': 'text/html', 'Content-Length': String(50 * 1024 * 1024) },
    });
  try {
    const result = await fetchBoundedHtml('https://example.com/', { userAgent: 'test' });
    assert.equal(result.ok, false);
  } finally {
    restoreFetch();
  }
});
