import { describe, expect, it } from 'vitest';

import { generateId, generateSlug, now, sha256 } from './id';

describe('id utils', () => {
  it('generates a UUID-like id', () => {
    expect(generateId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates slugs with the requested length and character set', () => {
    const slug = generateSlug(12);
    expect(slug).toHaveLength(12);
    expect(slug).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('returns an ISO timestamp', () => {
    const value = now();
    expect(new Date(value).toISOString()).toBe(value);
  });

  it('hashes strings with SHA-256', async () => {
    await expect(sha256('hello')).resolves.toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});
