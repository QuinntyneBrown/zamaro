import { type HttpRequest, withXsrfConfiguration } from '@angular/common/http';

/**
 * The API's CSRF cookie and header (ADR-0015). Pass to `provideHttpClient`: Angular copies the
 * cookie into the header on every state-changing request to a relative URL.
 */
export function withApiXsrf(): ReturnType<typeof withXsrfConfiguration> {
  return withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' });
}

/** API paths whose answers name the signed-in person (ADR-0017). */
const PERSONAL_PATHS = ['/api/v1/me', '/api/v1/account', '/api/v1/saved-artists'];

/**
 * The transfer-cache filter: a response the server fetched is replayed in the browser only when it
 * holds nothing personal, so no one's account can travel inside another person's page (ADR-0017).
 */
export function isTransferCacheable(request: HttpRequest<unknown>): boolean {
  const path = new URL(request.url, 'http://zamaro').pathname;
  return !PERSONAL_PATHS.some((personal) => path === personal || path.startsWith(`${personal}/`));
}
