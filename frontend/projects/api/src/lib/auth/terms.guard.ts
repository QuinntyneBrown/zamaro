import { inject } from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';
import { map } from 'rxjs';
import type { CurrentUser } from '../models/accounts';
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

/**
 * Where a completed sign-in goes (L2-080.3): to the new terms first when they are waiting, keeping
 * `returnUrl` for afterwards, since a public page has no guard to ask; otherwise straight there.
 */
export function afterSignIn(router: Router, user: CurrentUser, returnUrl: string): UrlTree {
  return user.termsAcceptanceRequired
    ? router.createUrlTree([ACCEPT_TERMS_PATH], { queryParams: { returnUrl } })
    : router.parseUrl(returnUrl);
}
