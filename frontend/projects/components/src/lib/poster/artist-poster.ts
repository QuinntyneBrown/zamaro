import { ChangeDetectionStrategy, Component, input, isDevMode } from '@angular/core';
import { Artwork } from '../artwork/artwork';
import { Rating } from '../rating/rating';

/**
 * The artist's header on the charcoal stage (docs/specs/components/poster.md, `.artist-poster`):
 * the breadcrumb, the halftone portrait beside the kicker, the name set poster-size, the facts line
 * (rating first) and the actions. Project the breadcrumb into `[slot=breadcrumb]` and the buttons
 * into `[slot=actions]`.
 */
@Component({
  selector: 'zm-artist-poster',
  imports: [Artwork, Rating],
  templateUrl: './artist-poster.html',
  styleUrls: ['./poster-frame.scss', './artist-poster.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistPoster {
  /** "Headliner · Gospel & contemporary vocalist". */
  readonly kicker = input.required<string>();
  readonly name = input.required<string>();
  readonly headingId = input('artist-name');
  /** Out of 5; null before the first review. */
  readonly rating = input.required<number | null>();
  /** "Rated 4.9 out of 5 by 38 churches". */
  readonly ratingLabel = input('');
  /** "38 churches"; hidden from assistive technology, since the rating's label says it. */
  readonly ratingCount = input('');
  /** "New". */
  readonly ratingNew = input('');
  /** "No reviews yet". */
  readonly noReviews = input('');
  /** Up to two more facts: "Brampton, ON", "Drives up to 120 km". */
  readonly facts = input<readonly string[]>([]);
  /** The portrait's description; empty keeps the artwork decorative. */
  readonly artLabel = input('');
  readonly artYellow = input(false);
  readonly artVariant = input<'solo' | 'group'>('solo');

  protected shownFacts(): readonly string[] {
    const facts = this.facts();
    if (facts.length > 2 && isDevMode()) {
      console.error(`zm-artist-poster: at most two facts, got ${facts.length}`);
    }
    return facts.slice(0, 2);
  }
}
