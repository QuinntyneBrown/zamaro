import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
  // Components with router links need a router; scenarios never navigate.
  providers: [provideBrowserGlobalErrorListeners(), provideRouter([])],
};
