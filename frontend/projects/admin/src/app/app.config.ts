import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  ADMIN_AUDIT_API,
  ADMIN_OVERVIEW_API,
  adminSessionExpiredInterceptor,
  AUTH_API,
  csrfRecoveryInterceptor,
  HttpAdminAuditApi,
  HttpAdminOverviewApi,
  HttpAuthApi,
  HttpPreferencesApi,
  PREFERENCES_API,
  provideI18n,
  withApiXsrf,
} from 'api';
import { routes } from './app.routes';
import { idleActivityInterceptor } from './shell/idle-session';

/**
 * The admin application's composition root (ADR-0001, ADR-0023). It renders in the browser only: the
 * web server serves it to a signed-in administrator and answers 404 to everyone else, so there is no
 * server rendering and no hydration here.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    // State-changing calls repeat the API's CSRF cookie in a header (ADR-0015); a refused token is
    // fetched again once. A 401 means the administrator's session ended: they leave to sign in
    // again (L2-066.2). Every answer restarts the idle warning's timer (L2-066.3).
    provideHttpClient(
      withFetch(),
      withApiXsrf(),
      withInterceptors([
        adminSessionExpiredInterceptor,
        csrfRecoveryInterceptor,
        idleActivityInterceptor,
      ]),
    ),
    provideI18n(),
    { provide: AUTH_API, useClass: HttpAuthApi },
    { provide: PREFERENCES_API, useClass: HttpPreferencesApi },
    { provide: ADMIN_OVERVIEW_API, useClass: HttpAdminOverviewApi },
    { provide: ADMIN_AUDIT_API, useClass: HttpAdminAuditApi },
  ],
};
