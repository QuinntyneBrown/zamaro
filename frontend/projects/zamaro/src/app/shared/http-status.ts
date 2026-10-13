import { inject, Injectable, RESPONSE_INIT } from '@angular/core';

/**
 * The HTTP status of the server-rendered page, so a crawler gets a real 404 or 301 rather than a soft
 * 200 (L2-021, L2-112). In the browser there is no response to set, and it does nothing.
 */
@Injectable({ providedIn: 'root' })
export class HttpStatus {
  private readonly response = inject(RESPONSE_INIT, { optional: true });

  set(status: number): void {
    if (this.response) this.response.status = status;
  }
}
