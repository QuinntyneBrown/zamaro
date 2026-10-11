import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ACCEPT_TERMS_PATH } from './terms.guard';

/**
 * A call the API stopped with the 409 `terms-acceptance-required` problem (L2-080.3) sends the person
 * to accept the new terms, keeping the page they were on.
 */
export const termsInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 409 &&
        String(error.error?.type ?? '').endsWith('/terms-acceptance-required') &&
        !router.url.startsWith(ACCEPT_TERMS_PATH)
      ) {
        void router.navigate([ACCEPT_TERMS_PATH], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
