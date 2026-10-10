import { FetchBackend, HttpBackend, type HttpEvent, type HttpRequest } from '@angular/common/http';
import { inject, Injectable, InjectionToken, type Provider } from '@angular/core';
import type { Observable } from 'rxjs';

/** Where the server-side renderer reaches the Zamaro API, e.g. `http://api:8000`. Server only. */
export const API_ORIGIN = new InjectionToken<string>('API_ORIGIN');

/**
 * During SSR, sends `/api/...` requests straight to the API instead of back through the web origin.
 * It sits below every interceptor, so the HTTP transfer cache keys the request by the same relative
 * URL the browser uses, and hydration reuses the response instead of fetching it again.
 */
@Injectable()
export class ApiOriginBackend implements HttpBackend {
  private readonly next = inject(FetchBackend);
  private readonly origin = inject(API_ORIGIN).replace(/\/$/, '');

  handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const url = new URL(request.url, 'http://relative.invalid');
    if (!url.pathname.startsWith('/api/')) {
      return this.next.handle(request);
    }
    return this.next.handle(request.clone({ url: `${this.origin}${url.pathname}${url.search}` }));
  }
}

/** Server-only providers: route API calls to `origin`. Use after `provideHttpClient(withFetch())`. */
export function provideApiOrigin(origin: string): Provider[] {
  return [
    { provide: API_ORIGIN, useValue: origin },
    { provide: HttpBackend, useClass: ApiOriginBackend },
  ];
}
