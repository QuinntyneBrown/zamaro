import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/discover/discover').then((m) => m.Discover),
  },
];
