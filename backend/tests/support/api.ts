import { inject } from 'vitest';

/** A request to the test API as a client would send it; cookies and redirects are the caller's. */
export function api(
  path: string,
  init: RequestInit = {},
  baseUrl = inject('apiUrl'),
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, { redirect: 'manual', ...init });
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
