import { vi, describe, expect, it, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCachedLink: vi.fn(),
  setCachedLink: vi.fn(),
  getLinkBySlug: vi.fn(),
  recordVisit: vi.fn(),
}));

vi.mock('../cache/index', () => ({
  getCachedLink: mocks.getCachedLink,
  setCachedLink: mocks.setCachedLink,
}));

vi.mock('../db/index', () => ({
  getLinkBySlug: mocks.getLinkBySlug,
}));

vi.mock('../analytics/index', () => ({
  recordVisit: mocks.recordVisit,
}));

import { handleRedirect } from './redirect';

describe('handleRedirect', () => {
  const env = {
    DB: {},
    KV: {},
    ADMIN_TOKEN: 'secret-token',
    LINKORA_VERSION: 'test',
  };

  const executionCtx: {
    waitUntil: ReturnType<typeof vi.fn>;
  } = {
    waitUntil: vi.fn(),
  };

  const makeContext = (slug: string) =>
    ({
      req: {
        param: (name: string) => (name === 'slug' ? slug : ''),
        url: 'https://linkora.test/demo',
        raw: new Request('https://linkora.test/demo'),
      },
      env,
      executionCtx,
    }) as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a 404 page when the slug does not exist', async () => {
    mocks.getCachedLink.mockResolvedValue(null);
    mocks.getLinkBySlug.mockResolvedValue(null);

    const response = await handleRedirect(makeContext('missing'));

    expect(response.status).toBe(404);
    expect(await response.text()).toContain('The short link you are looking for does not exist.');
    expect(mocks.setCachedLink).not.toHaveBeenCalled();
  });

  it('redirects from cached links and schedules analytics', async () => {
    mocks.getCachedLink.mockResolvedValue({
      id: '1',
      slug: 'demo',
      domain: 'linkora.test',
      longUrl: 'https://example.com/article',
      redirectType: 302,
      status: 'active',
      warningEnabled: false,
    });
    mocks.getLinkBySlug.mockResolvedValue({
      id: '1',
      slug: 'demo',
      domain: 'linkora.test',
      long_url: 'https://example.com/article',
      redirect_type: 302,
      status: 'active',
      expires_at: null,
      max_clicks: null,
      warning_enabled: 0,
    });
    mocks.recordVisit.mockResolvedValue(undefined);

    const response = await handleRedirect(makeContext('demo'));

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://example.com/article');
    expect(mocks.recordVisit).toHaveBeenCalledTimes(1);
    expect(executionCtx.waitUntil).toHaveBeenCalledTimes(1);
  });

  it('renders disabled links from cache', async () => {
    mocks.getCachedLink.mockResolvedValue({
      id: '1',
      slug: 'demo',
      domain: 'linkora.test',
      longUrl: 'https://example.com/article',
      redirectType: 302,
      status: 'disabled',
      warningEnabled: false,
    });

    const response = await handleRedirect(makeContext('demo'));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Link Disabled');
  });
});
