import { describe, expect, it } from 'vitest';

import auth from './auth';

async function readJson(response: Response) {
  return response.json() as Promise<{ success: boolean; data?: unknown; error?: string }>;
}

describe('auth routes', () => {
  it('logs in with the configured token', async () => {
    const response = await auth.request(
      '/login',
      {
        method: 'POST',
        body: JSON.stringify({ token: 'secret-token' }),
        headers: { 'Content-Type': 'application/json' },
      },
      {
        ADMIN_TOKEN: 'secret-token',
      },
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: { authenticated: true, message: 'Login successful' },
    });
  });

  it('rejects bad tokens and malformed requests', async () => {
    const badToken = await auth.request(
      '/login',
      {
        method: 'POST',
        body: JSON.stringify({ token: 'wrong' }),
        headers: { 'Content-Type': 'application/json' },
      },
      {
        ADMIN_TOKEN: 'secret-token',
      },
    );

    expect(badToken.status).toBe(401);

    const malformed = await auth.request('/login', {
      method: 'POST',
      body: '{',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(malformed.status).toBe(400);
  });

  it('authorizes /me and supports logout', async () => {
    const me = await auth.request('/me', {
      headers: { Authorization: 'Bearer secret-token' },
    }, {
      ADMIN_TOKEN: 'secret-token',
    });
    expect(me.status).toBe(200);

    const logout = await auth.request('/logout', { method: 'POST' });
    expect(logout.status).toBe(200);
    await expect(readJson(logout)).resolves.toEqual({
      success: true,
      data: { message: 'Logged out' },
    });
  });
});
