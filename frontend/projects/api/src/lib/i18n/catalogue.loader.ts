import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { map, type Observable } from 'rxjs';

interface CatalogueResponse {
  data: { locale: string; messages: Record<string, string> };
}

/**
 * Loads `GET /api/v1/i18n/{locale}`: flat `{namespace}.{key}` ICU messages, English filling any gap.
 * During SSR the response travels to the browser in TransferState, so hydration does not fetch it again.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(locale: string): Observable<Translation> {
    return this.http
      .get<CatalogueResponse>(`/api/v1/i18n/${encodeURIComponent(locale)}`)
      .pipe(map((response) => response.data.messages));
  }
}
