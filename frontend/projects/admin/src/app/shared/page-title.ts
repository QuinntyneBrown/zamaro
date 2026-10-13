import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

/** The document title of an admin screen: "{page} · Zamaro admin". */
@Injectable({ providedIn: 'root' })
export class PageTitle {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);

  set(key: string): void {
    this.title.setTitle(
      this.transloco.translate('admin.pageTitle', { page: this.transloco.translate(key) }),
    );
  }
}
