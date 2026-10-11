import { Routes } from '@angular/router';
import { signedInGuard } from 'api';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/discover/discover').then((m) => m.Discover),
  },
  {
    path: 'artists/:slug',
    loadComponent: () => import('./pages/artist/artist').then((m) => m.ArtistPage),
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
    canActivate: [signedInGuard],
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
    path: 'account',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/account/account').then((m) => m.Account),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
