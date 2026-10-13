import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

/** A photo the artwork prints in its frame (docs/specs/components/artwork.md). */
export interface ArtworkPhoto {
  /** Fallback rendition (WebP). */
  src: string;
  /** Intrinsic size of `src`, written to the img so the frame never shifts. */
  width: number;
  height: number;
  /** WebP renditions with width descriptors. */
  srcset?: string;
  /** AVIF renditions; when set, a <picture> with an AVIF <source> wraps the img. */
  avifSrcset?: string;
  /** The rendered width per breakpoint. Required whenever a srcset is set. */
  sizes?: string;
}

/**
 * The halftone artwork placeholder (docs/design-system/components/artwork): a singer's silhouette,
 * or a group's, cut out of the dots. With a `photo`, the photo is printed over it in greyscale; a
 * photo that fails to load falls back to the placeholder. Decorative unless it has a `label`.
 */
@Component({
  selector: 'zm-artwork',
  host: {
    class: 'art',
    '[class.art--group]': "variant() === 'group'",
    '[class.art--square]': "ratio() === 'square'",
    '[class.art--wide]': "ratio() === 'wide'",
    '[class.art--tilt]': 'tilt()',
    '[class.art--yellow]': 'yellow()',
    '[attr.role]': "hostLabel() ? 'img' : null",
    '[attr.aria-label]': 'hostLabel() || null',
    '[attr.aria-hidden]': "label() ? null : 'true'",
  },
  template: `@if (showPhoto()) {
      @let image = photo()!;
      @if (image.avifSrcset) {
        <picture>
          <source type="image/avif" [attr.srcset]="image.avifSrcset" [attr.sizes]="image.sizes" />
          <ng-container *ngTemplateOutlet="img" />
        </picture>
      } @else {
        <ng-container *ngTemplateOutlet="img" />
      }
      <ng-template #img>
        <img
          [src]="image.src"
          [attr.srcset]="image.srcset"
          [attr.sizes]="image.sizes"
          [width]="image.width"
          [height]="image.height"
          [alt]="label()"
          [attr.loading]="priority() ? 'eager' : 'lazy'"
          [attr.fetchpriority]="priority() ? 'high' : null"
          decoding="async"
          (error)="failedSrc.set(image.src)"
        />
      </ng-template>
    }
    @if (tag()) {
      <span class="art__tag">{{ tag() }}</span>
    }`,
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

    :host(.art--square) {
      aspect-ratio: 1;
    }

    :host(.art--wide) {
      aspect-ratio: 16 / 9;
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

    :host(.art--wide)::before {
      width: 34%;
    }

    :host(.art--wide.art--group)::before {
      width: 60%;
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

    /* The photo is printed onto the paper: greyscale, multiplied. Nothing fades in. */
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(1) contrast(1.1);
      mix-blend-mode: multiply;
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

    @media (forced-colors: active) {
      :host {
        border-color: CanvasText;
      }
    }
  `,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Artwork {
  readonly variant = input<'solo' | 'group'>('solo');
  /** Portrait is 4:5; `square` is 1:1 (the photo grid); `wide` is 16:9 (videos, the viewer). */
  readonly ratio = input<'portrait' | 'square' | 'wide'>('portrait');
  readonly tilt = input(false, { transform: booleanAttribute });
  readonly yellow = input(false, { transform: booleanAttribute });
  readonly tag = input<string>();
  /** Describes the picture; without it the artwork is hidden from assistive technology. */
  readonly label = input('');
  /** The photo; null shows the placeholder. */
  readonly photo = input<ArtworkPhoto | null>(null);
  /** Above the fold or the page's largest image: load eagerly with high priority. */
  readonly priority = input(false, { transform: booleanAttribute });

  /** The photo that failed to load; a different photo is tried afresh. */
  protected readonly failedSrc = signal<string | null>(null);
  protected readonly showPhoto = computed(() => {
    const photo = this.photo();
    return photo !== null && photo.src !== this.failedSrc();
  });
  /** The host's name while it shows the placeholder; a photo is named by its img's alt. */
  protected readonly hostLabel = computed(() => (this.showPhoto() ? '' : this.label()));
}
