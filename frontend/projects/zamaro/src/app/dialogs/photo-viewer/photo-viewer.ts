import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  type Injector,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { ProfilePhoto } from 'api';
import { Artwork, Button, Dialog, Icon } from 'components';

export const PHOTO_VIEWER_TITLE_ID = 'photo-viewer-title';
const DESCRIPTION_ID = 'photo-viewer-desc';
/** The viewer's image width per breakpoint (the dialog body is 40 rem at most). */
const VIEWER_SIZES = 'min(100vw, 40rem)';

export interface PhotoViewerData {
  /** "Abigail Mensah", for the kicker. */
  artistName: string;
  photos: readonly ProfilePhoto[];
  /** The photo that opened the viewer, from 0. */
  index: number;
}

/**
 * Opens the viewer at a photo. Focus starts on Close; Escape or Close returns it to the photo
 * that opened the viewer (L2-015.2).
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

/**
 * The full-size photo viewer (docs/mocks/dialogs/photo-viewer): one photo at a time with Previous
 * and Next, which the left and right arrow keys also press. Previous is disabled on the first photo
 * and Next on the last.
 */
@Component({
  selector: 'zm-photo-viewer-dialog',
  imports: [Artwork, Button, Dialog, Icon, TranslocoPipe],
  host: { '(keydown.arrowleft)': 'previous()', '(keydown.arrowright)': 'next()' },
  template: `<zm-dialog
    [kicker]="'artist.photoViewer.kicker' | transloco: { name: data.artistName }"
    [heading]="
      'artist.photoViewer.title' | transloco: { position: index() + 1, total: data.photos.length }
    "
    [titleId]="titleId"
    [closeLabel]="'artist.photoViewer.close' | transloco"
    (closed)="dialogRef.close()"
  >
    <zm-artwork ratio="wide" priority [photo]="image()" [label]="photo().alt" />
    <p [id]="descriptionId" class="text-muted">{{ photo().alt }}</p>
    <zm-button
      slot="footer"
      class="photo-viewer__previous"
      [disabled]="isFirst()"
      (click)="previous()"
      ><zm-icon name="arrow-left" />{{ 'artist.photoViewer.previous' | transloco }}</zm-button
    >
    <zm-button
      slot="footer"
      class="photo-viewer__next"
      variant="primary"
      [disabled]="isLast()"
      (click)="next()"
      >{{ 'artist.photoViewer.next' | transloco }}<zm-icon name="arrow-right"
    /></zm-button>
  </zm-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoViewerDialog {
  protected readonly dialogRef = inject(DialogRef);
  protected readonly data = inject<PhotoViewerData>(DIALOG_DATA);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  protected readonly titleId = PHOTO_VIEWER_TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;

  protected readonly index = signal(this.data.index);
  protected readonly photo = computed(() => this.data.photos[this.index()]);
  protected readonly image = computed(() => ({ ...this.photo(), sizes: VIEWER_SIZES }));
  protected readonly isFirst = computed(() => this.index() === 0);
  protected readonly isLast = computed(() => this.index() === this.data.photos.length - 1);

  protected previous(): void {
    if (this.isFirst()) return;
    this.index.update((index) => index - 1);
    if (this.isFirst()) this.keepFocus('.photo-viewer__next');
  }

  protected next(): void {
    if (this.isLast()) return;
    this.index.update((index) => index + 1);
    if (this.isLast()) this.keepFocus('.photo-viewer__previous');
  }

  /** A button that becomes disabled drops focus; hand it to the other one so it stays inside. */
  private keepFocus(selector: string): void {
    const active = this.document.activeElement;
    const pressed = this.host.nativeElement.contains(active) ? active : null;
    if (pressed?.closest('zm-button')) {
      queueMicrotask(() =>
        this.host.nativeElement.querySelector<HTMLButtonElement>(`${selector} button`)?.focus(),
      );
    }
  }
}
