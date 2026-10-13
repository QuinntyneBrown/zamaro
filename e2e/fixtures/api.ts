import type { APIRequestContext } from '@playwright/test';

/** The site as playwright.config.ts serves it; the API only trusts same-origin callers (ADR-0015). */
const SITE = 'http://localhost:4000';

/**
 * Reads JSON from the API as the signed-in browser would: through the web server's /api proxy, with
 * the site as referer so the session cookie counts. For a spec that checks what a page did on the
 * server (an audit entry, a search result) without a page object for it.
 */
export async function apiJson<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(path, {
    headers: { Referer: `${SITE}/`, Accept: 'application/json' },
  });
  if (!response.ok()) {
    throw new Error(`GET ${path} answered ${response.status()}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}
