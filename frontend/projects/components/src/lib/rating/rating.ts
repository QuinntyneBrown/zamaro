import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * An average rating read as one labelled image, never as star characters (L2-102.4):
 * "★ 4.6 · 17 churches", or the `newText` ("New") before the first review.
 */
@Component({
  selector: 'zm-rating',
  template: `<span role="img" [attr.aria-label]="label()">
    @if (score() === null) {
      {{ newText() }}
    } @else {
      ★ {{ scoreText() }} · {{ countText() }}
    }
  </span>`,
  styles: `
    :host {
      display: inline;
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rating {
  /** Out of 5, one decimal; null before the first review. */
  readonly score = input.required<number | null>();
  /** The accessible name: "Rated 4.6 out of 5 by 17 churches". */
  readonly label = input.required<string>();
  /** "17 churches". */
  readonly countText = input('');
  /** Shown instead of a score before the first review: "New". */
  readonly newText = input('');

  protected readonly scoreText = computed(() => this.score()?.toFixed(1));
}
