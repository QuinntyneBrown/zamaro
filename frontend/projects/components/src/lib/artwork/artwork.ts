import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The halftone artwork placeholder (docs/design-system/components/artwork): a singer's silhouette,
 * or a group's, cut out of the dots. Decorative unless it has a `label`.
 */
@Component({
  selector: 'zm-artwork',
  host: {
    '[class.art--group]': "variant() === 'group'",
    '[class.art--tilt]': 'tilt()',
    '[class.art--yellow]': 'yellow()',
    '[attr.role]': "label() ? 'img' : null",
    '[attr.aria-label]': 'label() ?? null',
    '[attr.aria-hidden]': "label() ? null : 'true'",
  },
  template: `@if (tag()) {
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
  readonly tilt = input(false);
  readonly yellow = input(false);
  readonly tag = input<string>();
  /** Describes the picture; without it the artwork is hidden from assistive technology. */
  readonly label = input<string>();
}
