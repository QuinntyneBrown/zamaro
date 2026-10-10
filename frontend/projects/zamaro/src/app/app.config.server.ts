import { mergeApplicationConfig, ApplicationConfig, inject } from '@angular/core';
import { IS_DISCOVERING_ROUTES, provideServerRendering, withRoutes } from '@angular/ssr';
import { provideApiOrigin, SKIP_CATALOGUE_PRELOAD } from 'api';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideApiOrigin(process.env['API_ORIGIN'] ?? 'http://localhost:8000'),
    // The build extracts routes without rendering a page, so it needs no API (L2-111 still holds
    // for every real request).
    { provide: SKIP_CATALOGUE_PRELOAD, useFactory: () => inject(IS_DISCOVERING_ROUTES) },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
