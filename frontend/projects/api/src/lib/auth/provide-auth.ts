import { withXsrfConfiguration } from '@angular/common/http';

/**
 * The API's CSRF cookie and header (ADR-0015). Pass to `provideHttpClient`: Angular copies the
 * cookie into the header on every state-changing request to a relative URL.
 */
export function withApiXsrf(): ReturnType<typeof withXsrfConfiguration> {
  return withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' });
}
