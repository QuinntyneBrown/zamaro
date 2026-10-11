import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  ACCOUNT_API,
  ARTIST_AVAILABILITY_API,
  ARTIST_PROFILES_API,
  AUTH_API,
  BOT_CHALLENGE,
  CONSENT_API,
  CSRF_REFUSED,
  csrfRecoveryInterceptor,
  DISCOVERY_API,
  FakeBotChallenge,
  FEATURES_API,
  HttpAccountApi,
  HttpArtistAvailabilityApi,
  HttpArtistProfilesApi,
  HttpAuthApi,
  HttpConsentApi,
  HttpDiscoveryApi,
  HttpFeaturesApi,
  HttpReviewsApi,
  isTransferCacheable,
  provideI18n,
  REVIEWS_API,
  sessionExpiredInterceptor,
  withApiXsrf,
} from 'api';
import { routes } from './app.routes';
import { csrfRefusedToast } from './shared/session-notices';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // A new page starts at the top; Back returns to where the page was (L2-009.2).
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    // State-changing calls repeat the API's CSRF cookie in a header (ADR-0015). A refused token is
    // fetched again once; a 401 while signed in means the session ended (manage-sessions-and-csrf).
    provideHttpClient(
      withFetch(),
      withApiXsrf(),
      withInterceptors([sessionExpiredInterceptor, csrfRecoveryInterceptor]),
    ),
    { provide: CSRF_REFUSED, useFactory: csrfRefusedToast },
    // GET responses made while rendering on the server are replayed in the browser, not re-fetched,
    // except personal ones (ADR-0017).
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({ filter: isTransferCacheable }),
    ),
    provideI18n(),
    { provide: DISCOVERY_API, useClass: HttpDiscoveryApi },
    { provide: ARTIST_PROFILES_API, useClass: HttpArtistProfilesApi },
    { provide: ARTIST_AVAILABILITY_API, useClass: HttpArtistAvailabilityApi },
    { provide: REVIEWS_API, useClass: HttpReviewsApi },
    { provide: FEATURES_API, useClass: HttpFeaturesApi },
    { provide: AUTH_API, useClass: HttpAuthApi },
    { provide: CONSENT_API, useClass: HttpConsentApi },
    { provide: ACCOUNT_API, useClass: HttpAccountApi },
    // The bot check's vendor is chosen in M10 (M2 D2); until then every check passes.
    { provide: BOT_CHALLENGE, useClass: FakeBotChallenge },
  ],
};
