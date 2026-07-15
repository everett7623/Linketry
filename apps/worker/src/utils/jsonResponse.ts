import type { ApiResponse } from '@linketry/shared';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store',
};

export function jsonOk<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export function jsonError(error: string, status = 400): Response {
  const body: ApiResponse = { success: false, error };
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export function jsonCreated<T>(data: T): Response {
  return jsonOk(data, 201);
}
