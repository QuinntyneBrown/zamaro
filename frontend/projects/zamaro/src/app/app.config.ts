import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { DISCOVERY_API, HttpDiscoveryApi, provideI18n } from 'api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    provideHttpClient(withFetch()),
    // GET responses made while rendering on the server are replayed in the browser, not re-fetched.
    provideClientHydration(withEventReplay(), withHttpTransferCacheOptions({})),
    provideI18n(),
    { provide: DISCOVERY_API, useClass: HttpDiscoveryApi },
  ],
};
