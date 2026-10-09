import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { runFromLocation } from './renderer';

bootstrapApplication(App, appConfig)
  .then((appRef: ApplicationRef) => runFromLocation(appRef))
  .catch((err) => console.error(err));
