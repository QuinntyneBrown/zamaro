import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  ADMIN_OVERVIEW_API,
  AUTH_API,
  csrfRecoveryInterceptor,
  HttpAdminOverviewApi,
  HttpAuthApi,
  HttpPreferencesApi,
  PREFERENCES_API,
  provideI18n,
  withApiXsrf,
} from 'api';
import { routes } from './app.routes';

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
    // fetched again once.
    provideHttpClient(withFetch(), withApiXsrf(), withInterceptors([csrfRecoveryInterceptor])),
    provideI18n(),
    { provide: AUTH_API, useClass: HttpAuthApi },
    { provide: PREFERENCES_API, useClass: HttpPreferencesApi },
    { provide: ADMIN_OVERVIEW_API, useClass: HttpAdminOverviewApi },
  ],
};
