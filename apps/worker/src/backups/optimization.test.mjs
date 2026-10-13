import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname } from 'node:path';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
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

const { streamText } = await import('../utils/stream.ts');
const { streamBackupJson, createR2Backup } = await import('./index.ts');
const { linkFromBackupItem } = await import('./restoreHelpers.ts');
const { createDomain, updateDomain, setDefaultDomain, deleteDomain } = await import('../db/index.ts');
const { default: exportsRoute } = await import('../routes/export.ts');

function fixture(t, count = 0) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  const root = new URL('../../../../migrations/', import.meta.url);
  for (const file of readdirSync(root).filter(name => name.endsWith('.sql')).sort()) {
    sql.exec(readFileSync(new URL(file, root), 'utf8'));
  }
  const insert = sql.prepare('INSERT INTO links (id, slug, long_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  for (let i = 0; i < count; i++) insert.run(String(i), `link-${i}`, 'https://example.com', '2026-10-13', '2026-10-13');
  let pages = 0;
  const DB = {
    prepare(query) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async all() {
          if (query.startsWith('SELECT * FROM links')) pages++;
          return { results: sql.prepare(query).all(...args) };
        },
        async first() { return sql.prepare(query).get(...args) ?? null; },
        async run() { return { meta: sql.prepare(query).run(...args) }; },
      };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.run());
        sql.exec('COMMIT');
        return result;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
  return { sql, env: { DB, LINKETRY_ADMIN_TOKEN: 'test-admin-token' }, pages: () => pages };
}

test('stream producer waits for consumption and closes on cancellation', async () => {
  let produced = 0;
  let closed = false;
  const stream = streamText((async function* () {
    try { for (;;) { produced++; yield 'page'; } }
    finally { closed = true; }
  })());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(produced, 0);
  const reader = stream.getReader();
  await reader.read();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(produced, 1);
  await reader.cancel();
  assert.equal(closed, true);
  assert.equal(produced, 1);
});

test('cancellation during an in-flight read does not advance to another page', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let nextPage = false;
  const reader = streamText((async function* () {
    await gate;
    yield 'page';
    nextPage = true;
    yield 'another page';
  })()).getReader();
  const reading = reader.read();
  const cancelling = reader.cancel();
  release();
  await Promise.all([reading, cancelling]);
  assert.equal(nextPage, false);
});

test('backup stream bounds unread pages and preserves complete JSON', async t => {
  const f = fixture(t, 1001);
  const stream = streamBackupJson(f.env);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.pages(), 0);
  const reader = stream.getReader();
  await reader.read(); // metadata
  await reader.read(); // one 500-link page
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.pages(), 1);
  await reader.cancel();
  assert.equal(f.pages(), 1);
  const backup = await new Response(streamBackupJson(f.env)).json();
  assert.equal(backup.links.length, 1001);
  assert.equal(new Set(backup.links.map(link => link.id)).size, 1001);
});

test('CSV and JSON exports wait for readers and remain valid across page boundaries', async t => {
  const f = fixture(t, 1001);
  for (const path of ['/links.csv', '/links.json']) {
    const before = f.pages();
    const response = await exportsRoute.request(path, { headers: { Authorization: 'Bearer test-admin-token' } }, f.env);
    assert.equal(response.status, 200);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.pages(), before);
    const reader = response.body.getReader();
    await reader.read();
    await reader.read();
    assert.equal(f.pages(), before + 1);
    await reader.cancel();
    const full = await exportsRoute.request(path, { headers: { Authorization: 'Bearer test-admin-token' } }, f.env);
    if (path.endsWith('.json')) assert.equal((await full.json()).length, 1001);
    else assert.equal((await full.text()).trim().split('\r\n').length, 1002);
  }
});

test('same-time R2 backups store independent objects and matching sizes', async t => {
  const f = fixture(t, 1);
  const objects = new Map();
  f.env.BACKUPS = { async put(key, body) { objects.set(key, await new Response(body).arrayBuffer()); } };
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : ['2026-10-13T01:00:00.000Z'])); }
  };
  try {
    const first = await createR2Backup(f.env);
    const second = await createR2Backup(f.env, 'pre-restore');
    assert.notEqual(first.filename, second.filename);
    assert.equal(objects.size, 2);
    assert.equal(first.size, objects.get(first.filename).byteLength);
    assert.equal(second.size, objects.get(second.filename).byteLength);
  } finally { globalThis.Date = RealDate; }
});

test('renamed restore links use the new slug while unchanged links preserve their URL', () => {
  const item = { slug: 'foo', longUrl: 'https://example.com', shortUrl: 'https://short.example/foo', domain: 'short.example' };
  assert.equal(linkFromBackupItem(item, 'id', 'foo-2', 'fallback.example', '2026-10-13').short_url, 'https://short.example/foo-2');
  assert.equal(linkFromBackupItem(item, 'id', 'foo', 'fallback.example', '2026-10-13').short_url, item.shortUrl);
});

const domain = (id, name, is_default = 1) => ({ id, domain: name, is_default, status: 'active', created_at: '2026-10-13', updated_at: '2026-10-13' });
function defaultState(sql) {
  return {
    domains: sql.prepare('SELECT domain FROM domains WHERE is_default = 1 ORDER BY domain').all().map(row => row.domain),
    setting: sql.prepare("SELECT value FROM settings WHERE key = 'default_domain'").get()?.value,
  };
}

test('failed domain creation and update preserve the previous default and setting', async t => {
  const { sql, env } = fixture(t);
  await createDomain(env, domain('a', 'a.example'));
  await createDomain(env, domain('b', 'b.example', 0));
  await assert.rejects(createDomain(env, domain('c', 'a.example')));
  assert.deepEqual(defaultState(sql), { domains: ['a.example'], setting: 'a.example' });
  await assert.rejects(updateDomain(env, 'b', domain('b', 'a.example')));
  assert.deepEqual(defaultState(sql), { domains: ['a.example'], setting: 'a.example' });
  sql.exec("CREATE TRIGGER fail_setting BEFORE UPDATE ON settings BEGIN SELECT RAISE(ABORT, 'setting unavailable'); END");
  await assert.rejects(setDefaultDomain(env, 'b', '2026-10-13'));
  assert.deepEqual(defaultState(sql), { domains: ['a.example'], setting: 'a.example' });
});

test('default switch, rename, unsetting and deletion synchronize the setting', async t => {
  const { sql, env } = fixture(t);
  await createDomain(env, domain('a', 'a.example'));
  await createDomain(env, domain('b', 'b.example'));
  assert.deepEqual(defaultState(sql), { domains: ['b.example'], setting: 'b.example' });
  await updateDomain(env, 'b', domain('b', 'renamed.example'));
  assert.deepEqual(defaultState(sql), { domains: ['renamed.example'], setting: 'renamed.example' });
  await updateDomain(env, 'b', domain('b', 'renamed.example', 0));
  assert.deepEqual(defaultState(sql), { domains: [], setting: '' });
  await setDefaultDomain(env, 'a', '2026-10-13');
  await setDefaultDomain(env, 'missing', '2026-10-13');
  await updateDomain(env, 'missing', domain('missing', 'missing.example'));
  assert.deepEqual(defaultState(sql), { domains: ['a.example'], setting: 'a.example' });
  await deleteDomain(env, 'b');
  assert.deepEqual(defaultState(sql), { domains: ['a.example'], setting: 'a.example' });
  await deleteDomain(env, 'a');
  assert.deepEqual(defaultState(sql), { domains: [], setting: '' });
});
