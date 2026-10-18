import { Routes } from '@angular/router';
import { adminGuard } from 'api';

/**
 * Every admin screen sits behind `adminGuard`: anyone but a signed-in administrator falls through
 * to the not-found route (L2-066.1). Paths are relative to the `/admin/` base.
 */
export const routes: Routes = [
  {
    path: '',
    canMatch: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'applications' },
      {
        path: 'applications',
        loadComponent: () =>
          import('./pages/applications/applications').then((m) => m.ApplicationsPage),
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./pages/application/application').then((m) => m.ApplicationPage),
      },
      {
        path: 'artists',
        loadComponent: () => import('./pages/artists/artists').then((m) => m.ArtistsPage),
      },
      {
        path: 'artists/:id',
        loadComponent: () => import('./pages/artist/artist').then((m) => m.ArtistPage),
      },
      {
        path: 'vulnerable-sector-checks',
        loadComponent: () => import('./pages/checks/checks').then((m) => m.ChecksPage),
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit-log/audit-log').then((m) => m.AuditLogPage),
      },
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
