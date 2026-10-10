import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonShape =
  'text' | 'title' | 'poster' | 'figure' | 'portrait' | 'target' | 'block' | 'strip';
export type SkeletonWidth = 'short' | 'medium' | 'long' | 'full';

/**
 * A loading placeholder (docs/design-system/components/skeleton) sized like the content it stands
 * for, so the swap does not move the page (L2-105). Put `aria-hidden="true"` on the container and
 * announce the wait once in a status line outside it. The sweep stops under reduced motion.
 */
@Component({
  selector: 'zm-skeleton',
  host: {
    class: 'skeleton',
    '[class]': "'skeleton--' + shape() + (width() ? ' skeleton--' + width() : '')",
  },
  template: '',
  styles: `
    :host {
      display: block;
      min-height: 1rem;
      background: linear-gradient(
          90deg,
          var(--color-bg-subtle) 0 40%,
          var(--color-bg-subtle-hover) 50%,
          var(--color-bg-subtle) 60% 100%
        )
        0 0 / 300% 100%;
      animation: shimmer var(--duration-deliberate) linear infinite;
    }

    :host(.skeleton--text) {
      height: 1rem;
      width: 70%;
    }

    :host(.skeleton--title) {
      height: 1.75rem;
      width: 55%;
    }

    :host(.skeleton--poster) {
      height: clamp(3.5rem, 12vw, 8rem);
      width: 80%;
    }

    :host(.skeleton--figure) {
      height: 2.5rem;
      width: 50%;
    }

    :host(.skeleton--portrait) {
      aspect-ratio: 4 / 5;
    }

    :host(.skeleton--target) {
      width: var(--target-comfortable);
      height: var(--target-comfortable);
    }

    :host(.skeleton--block) {
      height: 100%;
      min-height: 6rem;
    }

    /* The marquee strip's height, so nothing jumps when the songs land. */
    :host(.skeleton--strip) {
      width: 100%;
      height: calc(var(--font-size-xl) + 2 * var(--space-3) + 2 * var(--border-width-thick));
    }

    :host(.skeleton--short) {
      width: 40%;
    }

    :host(.skeleton--medium) {
      width: 60%;
    }

    :host(.skeleton--long) {
      width: 90%;
    }

    :host(.skeleton--full) {
      width: 100%;
    }

    @keyframes shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: 0 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  readonly shape = input<SkeletonShape>('text');
  readonly width = input<SkeletonWidth>();
}
