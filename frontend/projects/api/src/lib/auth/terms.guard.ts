import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/** Where a person who must accept the new terms is sent, keeping where they were going. */
export const ACCEPT_TERMS_PATH = '/account/accept-terms';

/**
 * Every private page (L2-080.3): a person who has not accepted the current terms goes to accept them
 * first, and on to this page afterwards. Put it after `signedInGuard`.
 */
export const termsGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(AuthService)
    .whenKnown()
    .pipe(
      map((user) =>
        user?.termsAcceptanceRequired
          ? router.createUrlTree([ACCEPT_TERMS_PATH], { queryParams: { returnUrl: state.url } })
          : true,
      ),
    );
};
