import { describe, expect, it } from 'vitest';

import { disabledPage, jsonCreated, jsonError, jsonOk, notFound } from './response';

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('response utils', () => {
  it('builds JSON success responses', async () => {
    const response = jsonOk({ id: 'abc' });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: { id: 'abc' },
    });
  });

  it('builds JSON error responses', async () => {
    const response = jsonError('bad request', 422);

    expect(response.status).toBe(422);
    await expect(readJson(response)).resolves.toEqual({
      success: false,
      error: 'bad request',
    });
  });

  it('builds created responses', async () => {
    const response = jsonCreated({ slug: 'demo' });

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: { slug: 'demo' },
    });
  });

  it('renders HTML error pages', async () => {
    const response = notFound('No link here');
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(body).toContain('No link here');
    expect(body).toContain('404');
  });

  it('renders the disabled page', async () => {
    const response = disabledPage();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('Link Disabled');
  });
});
