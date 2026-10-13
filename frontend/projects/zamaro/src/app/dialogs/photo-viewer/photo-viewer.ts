import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import type { ProfilePhoto } from 'api';
import { Artwork, type ArtworkPhoto, Button, Dialog, Icon } from 'components';

export const PHOTO_VIEWER_TITLE_ID = 'photo-viewer-title';
const DESCRIPTION_ID = 'photo-viewer-desc';

export interface PhotoViewerData {
  artistName: string;
  photos: readonly ProfilePhoto[];
  /** Index of the photo that opened the viewer. */
  start: number;
}

/**
 * Opens the viewer on one photo. It traps focus, closes on Escape or the backdrop, and returns
 * focus to the photo that opened it (L2-015.2).
 */
export function openPhotoViewer(
  injector: Injector,
  data: PhotoViewerData,
): DialogRef<unknown, PhotoViewerDialog> {
  return injector.get(CdkDialog).open(PhotoViewerDialog, {
    data,
    ariaLabelledBy: PHOTO_VIEWER_TITLE_ID,
    ariaDescribedBy: DESCRIPTION_ID,
    autoFocus: 'first-tabbable',
    restoreFocus: true,
    backdropClass: 'zm-backdrop',
  });
}

/** A profile photo full size, with previous and next (docs/mocks/dialogs/photo-viewer). */
@Component({
  selector: 'zm-photo-viewer-dialog',
  imports: [Artwork, Button, Dialog, Icon, TranslocoPipe],
  host: {
    '(keydown.arrowleft)': 'go(-1)',
    '(keydown.arrowright)': 'go(1)',
  },
  template: `<zm-dialog
    [heading]="title()"
    [titleId]="titleId"
    [kicker]="kicker"
    [closeLabel]="'artist.photoViewer.close' | transloco"
    (closed)="dialogRef.close()"
  >
    <zm-artwork ratio="wide" priority [label]="photo().alt" [photo]="image()" />
    <p class="text-muted" [id]="descriptionId">{{ photo().alt }}</p>
    <zm-button slot="footer" [disabled]="index() === 0" (click)="go(-1)"
      ><zm-icon name="arrow-left" />{{ 'artist.photoViewer.previous' | transloco }}</zm-button
    >
    <zm-button slot="footer" variant="primary" [disabled]="isLast()" (click)="go(1)"
      >{{ 'artist.photoViewer.next' | transloco }}<zm-icon name="arrow-right"
    /></zm-button>
  </zm-dialog>`,
  styles: `
    .text-muted {
      color: var(--color-fg-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoViewerDialog {
  protected readonly dialogRef = inject(DialogRef);
  private readonly data = inject<PhotoViewerData>(DIALOG_DATA);
  private readonly transloco = inject(TranslocoService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly titleId = PHOTO_VIEWER_TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;

  protected readonly index = signal(this.data.start);
  protected readonly photo = computed(() => this.data.photos[this.index()]);
  protected readonly isLast = computed(() => this.index() === this.data.photos.length - 1);
  protected readonly kicker = this.transloco.translate('artist.photoViewer.kicker', {
    name: this.data.artistName,
  });
  protected readonly title = computed(() =>
    this.transloco.translate('artist.photoViewer.title', {
      position: this.index() + 1,
      total: this.data.photos.length,
    }),
  );
  protected readonly image = computed<ArtworkPhoto>(() => ({
    ...this.photo(),
    sizes: 'min(100vw, 40rem)',
  }));

  protected go(step: number): void {
    const next = this.index() + step;
    if (next < 0 || next >= this.data.photos.length) return;
    this.index.set(next);
    // Reaching an end disables the button that was pressed; keep focus in the dialog.
    afterNextRender(
      () => {
        const host = this.host.nativeElement;
        const active = host.ownerDocument.activeElement;
        if (host.contains(active) && !active?.matches(':disabled')) return;
        host.querySelector<HTMLButtonElement>('.dialog__footer button:not(:disabled)')?.focus();
      },
      { injector: this.injector },
    );
  }
}
