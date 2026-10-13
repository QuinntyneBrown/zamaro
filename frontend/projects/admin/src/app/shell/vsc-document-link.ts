import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ADMIN_VULNERABLE_SECTOR_CHECKS_API } from 'api';
import { Button, Icon, ToastService } from 'components';

/**
 * "View document": opens a check's document in a new tab (verify-vulnerable-sector-check, L2-049.4).
 * The tab opens on the click, so no popup rule stops it, and lands on the signed media-host link once
 * the API answers; the API records that an administrator opened the document. The application
 * review screen (M3 S13) reuses it.
 */
@Component({
  selector: 'zm-vsc-document-link',
  imports: [Button, Icon, TranslocoPipe],
  template: `<zm-button size="sm" [busy]="busy()" (click)="open()"
    ><zm-icon name="document" />{{ 'admin.checks.viewDocument' | transloco
    }}<span class="visually-hidden">
      {{ 'admin.checks.viewDocumentOf' | transloco: { name: artistName() } }}</span
    ></zm-button
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VscDocumentLink {
  readonly checkId = input.required<number>();
  readonly artistName = input.required<string>();

  private readonly api = inject(ADMIN_VULNERABLE_SECTOR_CHECKS_API);
  private readonly toasts = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  protected readonly busy = signal(false);

  protected open(): void {
    if (this.busy()) return;
    const tab = this.document.defaultView?.open('', '_blank');
    if (tab) tab.opener = null;
    this.busy.set(true);
    this.api.documentLink(this.checkId()).subscribe({
      next: ({ url }) => {
        this.busy.set(false);
        if (tab) tab.location.href = url;
        else this.document.defaultView?.open(url, '_blank', 'noopener');
      },
      error: () => {
        this.busy.set(false);
        tab?.close();
        const title = this.transloco.translate('admin.checks.documentFailed', {
          name: this.artistName(),
        });
        this.toasts.show({
          variant: 'danger',
          title,
          text: this.transloco.translate('admin.checks.documentFailedText'),
          dismissLabel: this.transloco.translate('common.toast.dismiss', { title }),
        });
      },
    });
  }
}
