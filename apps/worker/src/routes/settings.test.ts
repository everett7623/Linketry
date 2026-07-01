import { vi, describe, expect, it, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getSettings: vi.fn(),
  setSetting: vi.fn(),
  now: vi.fn(() => '2024-01-01T00:00:00.000Z'),
}));

vi.mock('../auth/index', () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock('../db/index', () => ({
  getSettings: mocks.getSettings,
  setSetting: mocks.setSetting,
}));

vi.mock('../utils/id', () => ({
  now: mocks.now,
}));

import settings from './settings';

describe('settings routes', () => {
  const env = {
    DB: {},
    KV: {},
    ADMIN_TOKEN: 'secret-token',
    LINKORA_VERSION: 'test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockReturnValue(null);
  });

  it('returns all settings', async () => {
    mocks.getSettings.mockResolvedValue([
      { key: 'theme', value: 'dark', updated_at: '2024-01-01T00:00:00.000Z' },
    ]);

    const response = await settings.request('/', {
      headers: { Authorization: 'Bearer secret-token' },
    }, env as never);

    expect(response.status).toBe(200);
    expect(mocks.getSettings).toHaveBeenCalledTimes(1);
  });

  it('updates only string settings values', async () => {
    const response = await settings.request(
      '/',
      {
        method: 'PUT',
        body: JSON.stringify({
          site_name: 'Linkora',
          count: 12,
          feature_flag: 'enabled',
        }),
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secret-token' },
      },
      env as never,
    );

    expect(response.status).toBe(200);
    expect(mocks.now).toHaveBeenCalledTimes(1);
    expect(mocks.setSetting).toHaveBeenCalledTimes(2);
    expect(mocks.setSetting).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'site_name',
      'Linkora',
      '2024-01-01T00:00:00.000Z',
    );
    expect(mocks.setSetting).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'feature_flag',
      'enabled',
      '2024-01-01T00:00:00.000Z',
    );
  });

  it('rejects invalid json bodies', async () => {
    const response = await settings.request(
      '/',
      {
        method: 'PUT',
        body: '{',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secret-token' },
      },
      env as never,
    );

    expect(response.status).toBe(400);
  });
});
