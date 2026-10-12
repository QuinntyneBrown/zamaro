import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
} from '@angular/core';

/** A photo for the frame, in WebP widths and optionally AVIF (docs/specs/components/artwork.md). */
export interface ArtworkPhoto {
  /** Fallback rendition (WebP). */
  src: string;
  /** Intrinsic size of `src`, written to the img so the frame never shifts. */
  width: number;
  height: number;
  /** WebP renditions with width descriptors. */
  srcset?: string;
  /** AVIF renditions with the same widths; when set, a <picture> wraps the img. */
  avifSrcset?: string | null;
  /** The rendered width per breakpoint. Required whenever a srcset is set. */
  sizes?: string;
}

/**
 * The frame for every picture of an artist (docs/design-system/components/artwork): a singer's
 * silhouette, or a group's, cut out of a halftone until a photo arrives, then the photo in
 * greyscale multiplied onto the paper. A photo that fails to load falls back to the placeholder,
 * never a broken image. Decorative unless it has a `label`.
 */
@Component({
  selector: 'zm-artwork',
  imports: [NgTemplateOutlet],
  host: {
    class: 'art',
    '[class.art--group]': "variant() === 'group'",
    '[class.art--square]': "ratio() === 'square'",
    '[class.art--wide]': "ratio() === 'wide'",
    '[class.art--tilt]': 'tilt()',
    '[class.art--yellow]': 'yellow()',
    '[attr.role]': "label() && !shown() ? 'img' : null",
    '[attr.aria-label]': '(!shown() && label()) || null',
    '[attr.aria-hidden]': "label() ? null : 'true'",
  },
  template: `@if (shown(); as photo) {
      @if (photo.avifSrcset) {
        <picture
          ><source type="image/avif" [attr.srcset]="photo.avifSrcset" [attr.sizes]="photo.sizes" />
          <ng-container *ngTemplateOutlet="img; context: { $implicit: photo }"
        /></picture>
      } @else {
        <ng-container *ngTemplateOutlet="img; context: { $implicit: photo }" />
      }
    }
    @if (tag()) {
      <span class="art__tag">{{ tag() }}</span>
    }
    <ng-template #img let-photo>
      <img
        [src]="photo.src"
        [attr.srcset]="photo.srcset || null"
        [attr.sizes]="photo.sizes || null"
        [width]="photo.width"
        [height]="photo.height"
        [alt]="label() ?? ''"
        [attr.loading]="priority() ? 'eager' : 'lazy'"
        [attr.fetchpriority]="priority() ? 'high' : null"
        decoding="async"
        (error)="failed.set(true)"
      />
    </ng-template>`,
  styles: `
    :host {
      position: relative;
      display: grid;
      place-items: end start;
      overflow: hidden;
      aspect-ratio: 4 / 5;
      padding: var(--space-3);
      background:
        radial-gradient(circle, var(--color-halftone-ink) 28%, transparent 31%) 0 0 / 0.6rem 0.6rem,
        var(--color-halftone-paper);
      color: var(--color-fg-default);
      border: var(--border-width-thick) solid var(--color-border-strong);
    }

    /* The silhouette: a singer at a mic. */
    :host::before {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -8%;
      width: 70%;
      aspect-ratio: 1 / 1.25;
      translate: -50% 0;
      background: var(--color-halftone-paper);
      clip-path: polygon(
        38% 0,
        62% 0,
        70% 12%,
        66% 30%,
        58% 36%,
        92% 48%,
        100% 100%,
        0 100%,
        8% 48%,
        42% 36%,
        34% 30%,
        30% 12%
      );
    }

    :host(.art--group)::before {
      width: 92%;
      clip-path: polygon(
        10% 30%,
        20% 18%,
        30% 30%,
        27% 40%,
        40% 34%,
        50% 18%,
        60% 34%,
        73% 40%,
        70% 30%,
        80% 18%,
        90% 30%,
        86% 42%,
        100% 55%,
        100% 100%,
        0 100%,
        0 55%,
        14% 42%
      );
    }

    :host(.art--square) {
      aspect-ratio: 1;
    }

    :host(.art--wide) {
      aspect-ratio: 16 / 9;
    }

    :host(.art--wide)::before {
      width: 34%;
    }

    :host(.art--wide.art--group)::before {
      width: 60%;
    }

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(1) contrast(1.1);
      mix-blend-mode: multiply;
    }

    :host(.art--tilt) {
      background-size:
        0.85rem 0.85rem,
        auto;
    }

    :host(.art--yellow) {
      background:
        radial-gradient(circle, var(--color-border-on-accent) 28%, transparent 31%) 0 0 / 0.6rem
          0.6rem,
        var(--color-accent);
    }

    :host(.art--yellow)::before {
      background: var(--color-accent);
    }

    .art__tag {
      position: relative;
      z-index: var(--z-raised);
      padding: var(--space-1) var(--space-2);
      font: var(--text-overline);
      letter-spacing: var(--letter-spacing-wide);
      text-transform: uppercase;
      background: var(--color-bg-inverse);
      color: var(--color-fg-inverse);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Artwork {
  readonly variant = input<'solo' | 'group'>('solo');
  /** Portrait is 4:5; square is 1:1 (the gallery); wide is 16:9 (videos, the photo viewer). */
  readonly ratio = input<'portrait' | 'square' | 'wide'>('portrait');
  readonly tilt = input(false, { transform: booleanAttribute });
  readonly yellow = input(false, { transform: booleanAttribute });
  readonly tag = input<string>();
  /** Describes the picture; without it the artwork is hidden from assistive technology. */
  readonly label = input<string>();
  /** The photo; null keeps the placeholder. */
  readonly photo = input<ArtworkPhoto | null>(null);
  /** Above the fold or the page's largest image: loaded eagerly at high priority. */
  readonly priority = input(false, { transform: booleanAttribute });

  /** Set when the photo fails to load; a new photo tries again. */
  protected readonly failed = linkedSignal({ source: this.photo, computation: () => false });
  /** The photo to draw, or null for the placeholder. */
  protected readonly shown = computed(() => (this.failed() ? null : this.photo()));
}
