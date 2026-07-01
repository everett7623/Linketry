import { describe, expect, it } from 'vitest';

import { isAuthenticated, requireAuth } from './index';

function makeContext(authHeader?: string) {
  return {
    req: {
      header: (name: string) => (name === 'Authorization' ? authHeader ?? null : null),
    },
    env: {
      ADMIN_TOKEN: 'secret-token',
    },
  } as never;
}

describe('auth helpers', () => {
  it('accepts valid bearer tokens', () => {
    expect(requireAuth(makeContext('Bearer secret-token'))).toBeNull();
    expect(isAuthenticated(makeContext('Bearer secret-token'))).toBe(true);
  });

  it('rejects missing or invalid tokens', async () => {
    const response = requireAuth(makeContext());
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    await expect((response as Response).json()).resolves.toEqual({
      success: false,
      error: 'Unauthorized',
    });

    expect(isAuthenticated(makeContext('Bearer nope'))).toBe(false);
  });
});
