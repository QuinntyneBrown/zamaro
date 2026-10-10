import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  ARTIST_AVAILABILITY_API,
  ARTIST_PROFILES_API,
  AUTH_API,
  DISCOVERY_API,
  FEATURES_API,
  HttpArtistAvailabilityApi,
  HttpArtistProfilesApi,
  HttpAuthApi,
  HttpDiscoveryApi,
  HttpFeaturesApi,
  HttpReviewsApi,
  isTransferCacheable,
  provideI18n,
  REVIEWS_API,
  withApiXsrf,
} from 'api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // A new page starts at the top; Back returns to where the page was (L2-009.2).
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    // State-changing calls repeat the API's CSRF cookie in a header (ADR-0015).
    provideHttpClient(withFetch(), withApiXsrf()),
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
  ],
};
