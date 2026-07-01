import { describe, expect, it } from 'vitest';

import { GenericCsvAdapter, GenericJsonAdapter } from './generic';

describe('Generic import adapters', () => {
  it('detects and parses generic CSV exports', async () => {
    const input = [
      'slug,long_url,title,tags,clicks,created_at,updated_at,last_clicked_at',
      'demo,https://example.com,Example,"one|two;three",7,2024-01-01,2024-01-02,2024-01-03',
    ].join('\n');

    expect(GenericCsvAdapter.detect(input)).toBe(true);
    expect(await GenericCsvAdapter.parse(input)).toEqual([
      {
        slug: 'demo',
        longUrl: 'https://example.com',
        shortUrl: undefined,
        title: 'Example',
        description: undefined,
        tags: ['one', 'two', 'three'],
        clicks: 7,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        lastClickedAt: '2024-01-03',
        source: 'generic',
        raw: expect.any(Object),
      },
    ]);
  });

  it('detects and parses generic JSON exports', async () => {
    const input = JSON.stringify({
      data: [
        {
          short_code: 'json-demo',
          url: 'https://example.org',
          tags: ['alpha', 'beta'],
          clicks: '12',
        },
      ],
    });

    expect(GenericJsonAdapter.detect(input)).toBe(true);
    expect(await GenericJsonAdapter.parse(input)).toEqual([
      {
        slug: 'json-demo',
        longUrl: 'https://example.org',
        shortUrl: undefined,
        title: undefined,
        description: undefined,
        tags: ['alpha', 'beta'],
        clicks: 12,
        createdAt: undefined,
        updatedAt: undefined,
        lastClickedAt: undefined,
        source: 'generic',
        raw: {
          short_code: 'json-demo',
          url: 'https://example.org',
          tags: ['alpha', 'beta'],
          clicks: '12',
        },
      },
    ]);
  });

  it('validates parsed items', () => {
    const result = GenericCsvAdapter.validate({
      slug: 'admin',
      longUrl: 'javascript:alert(1)',
      source: 'generic',
      raw: {},
    } as never);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'Invalid slug: "admin" is a reserved path and cannot be used as a slug',
      'Invalid URL: javascript: URLs are not allowed',
    ]);
  });
});
