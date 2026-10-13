import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** `inline` sits in a line of facts; `summary` heads a reviews section with five stars. */
export type RatingVariant = 'inline' | 'summary';

/**
 * An average rating read as one labelled image, never as star characters (L2-102.4):
 * "★ 4.6 · 17 churches", "★★★★★ 4.9 · 38 churches" as a summary, or the `newText` ("New") before
 * the first review.
 */
@Component({
  selector: 'zm-rating',
  template: `<span role="img" [attr.aria-label]="label()" [class.stars]="variant() === 'summary'">
    @if (score() === null) {
      {{ newText() }}
    } @else {
      {{ glyphs() }} {{ scoreText() }}
      @if (countText()) {
        · {{ countText() }}
      }
    }
  </span>`,
  styles: `
    :host {
      display: inline;
      white-space: nowrap;
    }

    .stars {
      font: var(--text-stub);
      letter-spacing: var(--letter-spacing-wide);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rating {
  /** Out of 5, one decimal; null before the first review. */
  readonly score = input.required<number | null>();
  /** The accessible name: "Rated 4.6 out of 5 by 17 churches". */
  readonly label = input.required<string>();
  readonly variant = input<RatingVariant>('inline');
  /** "17 churches". */
  readonly countText = input('');
  /** Shown instead of a score before the first review: "New". */
  readonly newText = input('');

  protected readonly scoreText = computed(() => this.score()?.toFixed(1));

  /** One star inline; five in a summary, rounded to the nearest whole star (4.9 → ★★★★★). */
  protected readonly glyphs = computed(() => {
    if (this.variant() === 'inline') return '★';
    const filled = Math.min(5, Math.max(0, Math.floor((this.score() ?? 0) + 0.5)));
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  });
}
