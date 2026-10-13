import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** What the sign-in page receives when a session has ended: the email to fill in. */
export interface SessionEndedState {
  email: string;
}

/**
 * A 401 while someone is signed in means their session ended on the server: idle for 7 days, open
 * for 30, or ended from another device (L2-073.3). The person is forgotten here and sent to sign in
 * again, with the page to come back to and `ended=1`. Signing out answers 401 when the session had
 * already ended; that is not reported.
 */
export const sessionExpiredInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(request).pipe(
    catchError((error: unknown) => {
      const user = auth.currentUser();
      const signingOut = request.method === 'DELETE' && request.url.endsWith('/api/v1/session');
      if (error instanceof HttpErrorResponse && error.status === 401 && user && !signingOut) {
        auth.clear();
        const state: SessionEndedState = { email: user.email };
        void router.navigate(['/sign-in'], {
          queryParams: { returnUrl: router.url, ended: 1 },
          state,
        });
      }
      return throwError(() => error);
    }),
  );
};
