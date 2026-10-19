import { type Routes, type UrlMatcher, type UrlSegment } from '@angular/router';
import { signedInGuard, termsGuard } from 'api';

/** `artists/apply` and `artists/apply/:step`, as one route. */
const applyMatcher: UrlMatcher = (segments: UrlSegment[]) => {
  if (segments.length < 2 || segments.length > 3) return null;
  if (segments[0].path !== 'artists' || segments[1].path !== 'apply') return null;
  const posParams: Record<string, UrlSegment> = segments[2] ? { step: segments[2] } : {};
  return { consumed: segments, posParams };
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/discover/discover').then((m) => m.Discover),
  },
  // Apply as an artist sits before the profiles, so "apply" is never read as a slug (L2-087). Its
  // four steps share one route, so the page is reused between them and keeps the server's answers.
  {
    matcher: applyMatcher,
    loadComponent: () => import('./pages/apply/apply').then((m) => m.ApplyPage),
  },
  {
    path: 'artists/:slug',
    loadComponent: () => import('./pages/artist/artist').then((m) => m.ArtistPage),
  },
  // The artist workspace. A church account gets "This page is for artists" here instead of a
  // redirect (L2-074); the calendar and the other screens join as children when they are built, and
  // `/artist` redirects to the calendar with the first of them (J7-S5).
  {
    path: 'artist',
    canActivate: [signedInGuard, termsGuard],
    loadComponent: () => import('./pages/workspace/workspace').then((m) => m.Workspace),
    children: [],
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./pages/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./pages/sign-up/sign-up').then((m) => m.SignUp),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'account/security/mfa',
    canActivate: [signedInGuard, termsGuard],
    loadComponent: () => import('./pages/mfa-setup/mfa-setup').then((m) => m.MfaSetup),
  },
  {
    path: 'account/sign-in/verify',
    loadComponent: () => import('./pages/mfa-challenge/mfa-challenge').then((m) => m.MfaChallenge),
  },
  {
    path: 'account/email/confirm',
    loadComponent: () => import('./pages/confirm-email/confirm-email').then((m) => m.ConfirmEmail),
  },
  {
    path: 'account/accept-terms',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/accept-terms/accept-terms').then((m) => m.AcceptTerms),
  },
  {
    path: 'account',
    canActivate: [signedInGuard, termsGuard],
    loadComponent: () => import('./pages/account/account').then((m) => m.Account),
  },
  {
    path: 'saved',
    canActivate: [signedInGuard, termsGuard],
    loadComponent: () => import('./pages/saved/saved').then((m) => m.SavedPage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
