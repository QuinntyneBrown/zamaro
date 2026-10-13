import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * The admin application's answer to a 401: the administrator's session ended, idle for 30 minutes or
 * signed out elsewhere (L2-066.2). The admin application is served separately (ADR-0023), so the
 * person leaves it with a full navigation to the public sign-in page, which brings them back here
 * afterwards and says the session ended. Signing out answers 401 when the session had already ended;
 * that is not a surprise and is left to the caller.
 */
export const adminSessionExpiredInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const document = inject(DOCUMENT);
  return next(request).pipe(
    catchError((error: unknown) => {
      const signingOut = request.method === 'DELETE' && request.url.endsWith('/api/v1/session');
      if (error instanceof HttpErrorResponse && error.status === 401 && !signingOut) {
        const returnUrl = encodeURIComponent(`/admin${router.url === '/' ? '' : router.url}`);
        document.location.assign(`/sign-in?returnUrl=${returnUrl}&ended=1`);
      }
      return throwError(() => error);
    }),
  );
};
