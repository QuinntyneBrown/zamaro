import { Clipboard } from '@angular/cdk/clipboard';
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ToastService } from 'components';

/**
 * Shares a page's address (L2-113): the device's share sheet where there is one, otherwise the
 * address is copied and a "Link copied" toast confirms it. Closing the share sheet is not a failure,
 * and nothing follows.
 */
@Injectable({ providedIn: 'root' })
export class ShareLink {
  private readonly document = inject(DOCUMENT);
  private readonly clipboard = inject(Clipboard);
  private readonly toasts = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  async share(title: string, url: string): Promise<void> {
    const navigator = this.document.defaultView?.navigator;
    if (navigator?.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // The sheet could not open (no permission, nothing to share to): copy instead.
      }
    }
    if (!this.clipboard.copy(url)) return;
    const copied = this.transloco.translate('common.share.copied');
    this.toasts.show({
      kind: this.transloco.translate('common.share.kind'),
      title: copied,
      dismissLabel: this.transloco.translate('common.toast.dismiss', { title: copied }),
      key: 'share',
    });
  }
}
