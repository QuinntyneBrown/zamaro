import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * A private page (ADR-0017): a guest goes to sign in and comes back here afterwards. Private routes
 * render in the browser only, so the guard asks `/me` there.
 */
export const signedInGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(AuthService)
    .whenKnown()
    .pipe(
      map((user) =>
        user ? true : router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } }),
      ),
    );
};
