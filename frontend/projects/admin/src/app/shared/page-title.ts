import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

/** The document title of an admin screen: "{page} · Zamaro admin". */
@Injectable({ providedIn: 'root' })
export class PageTitle {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);

  set(key: string): void {
    this.setText(this.transloco.translate(key));
  }

  /** A title that is data, not copy: an artist's name. */
  setText(page: string): void {
    this.title.setTitle(this.transloco.translate('admin.pageTitle', { page }));
  }
}
