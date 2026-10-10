import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideApiOrigin } from 'api';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideApiOrigin(process.env['API_ORIGIN'] ?? 'http://localhost:8000'),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
