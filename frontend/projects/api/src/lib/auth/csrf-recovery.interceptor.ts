import {
  HttpErrorResponse,
  type HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  HttpXsrfTokenExtractor,
} from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';
import { XSRF_HEADER_NAME } from './provide-auth';

/** Called when a state-changing request is refused for its CSRF token twice in a row. */
export const CSRF_REFUSED = new InjectionToken<() => void>('CsrfRefused', {
  factory: () => () => undefined,
});

const STATE_CHANGING = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * A 419 means the API refused the request's CSRF token and changed nothing (L2-073.2). The token is
 * fetched again from `/sanctum/csrf-cookie` and the request repeated once; a second 419 is reported
 * through `CSRF_REFUSED` (security/manage-sessions-and-csrf).
 */
export const csrfRecoveryInterceptor: HttpInterceptorFn = (request, next) => {
  if (!STATE_CHANGING.includes(request.method)) return next(request);
  const refused = inject(CSRF_REFUSED);
  const tokens = inject(HttpXsrfTokenExtractor);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (!isCsrfMismatch(error)) return throwError(() => error);
      return next(new HttpRequest('GET', '/sanctum/csrf-cookie')).pipe(
        filter((event) => event instanceof HttpResponse),
        take(1),
        // Angular's XSRF interceptor runs before this one, so the retry sets the new token itself.
        switchMap(() =>
          next(request.clone({ setHeaders: { [XSRF_HEADER_NAME]: tokens.getToken() ?? '' } })),
        ),
        catchError((again: unknown) => {
          if (isCsrfMismatch(again)) refused();
          return throwError(() => again);
        }),
      );
    }),
  );
};

function isCsrfMismatch(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 419;
}
