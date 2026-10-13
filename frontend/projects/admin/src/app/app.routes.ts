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
