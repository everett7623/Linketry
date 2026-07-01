import { describe, expect, it } from 'vitest';

import { ShlinkAdapter } from './shlink';

describe('Shlink import adapter', () => {
  it('detects shlink-shaped inputs', () => {
    expect(ShlinkAdapter.detect('short code,long url\nabc,https://example.com')).toBe(true);
    expect(ShlinkAdapter.detect({ shortCode: 'abc' })).toBe(true);
    expect(ShlinkAdapter.detect({ data: { shortUrls: { data: [] } } })).toBe(true);
    expect(ShlinkAdapter.detect('slug,long_url\nabc,https://example.com')).toBe(false);
  });

  it('parses nested JSON exports', async () => {
    const input = {
      data: {
        shortUrls: {
          data: [
            {
              shortCode: 'abc123',
              shortUrl: 'https://sho.rt/abc123',
              longUrl: 'https://example.com/article',
              title: 'Article',
              tags: ['news'],
              dateCreated: '2024-02-01T00:00:00Z',
              visitsSummary: { total: 9 },
            },
          ],
        },
      },
    };

    expect(await ShlinkAdapter.parse(input)).toEqual([
      {
        slug: 'abc123',
        longUrl: 'https://example.com/article',
        shortUrl: 'https://sho.rt/abc123',
        title: 'Article',
        tags: ['news'],
        clicks: 9,
        createdAt: '2024-02-01T00:00:00Z',
        source: 'shlink',
        sourceId: 'abc123',
        raw: {
          shortCode: 'abc123',
          shortUrl: 'https://sho.rt/abc123',
          longUrl: 'https://example.com/article',
          title: 'Article',
          tags: ['news'],
          dateCreated: '2024-02-01T00:00:00Z',
          visitsSummary: { total: 9 },
        },
      },
    ]);
  });

  it('parses CSV exports', async () => {
    const input = [
      'Short Code,Long URL,Title,Tags,Visits,Created At',
      'slug-1,https://example.com,Hello,"alpha|beta",4,2024-03-01T00:00:00Z',
    ].join('\n');

    expect(await ShlinkAdapter.parse(input)).toEqual([
      {
        slug: 'slug-1',
        longUrl: 'https://example.com',
        shortUrl: undefined,
        title: 'Hello',
        tags: ['alpha', 'beta'],
        clicks: 4,
        createdAt: '2024-03-01T00:00:00Z',
        source: 'shlink',
        sourceId: 'slug-1',
        raw: {
          'Short Code': 'slug-1',
          'Long URL': 'https://example.com',
          Title: 'Hello',
          Tags: 'alpha|beta',
          Visits: '4',
          'Created At': '2024-03-01T00:00:00Z',
        },
      },
    ]);
  });
});
