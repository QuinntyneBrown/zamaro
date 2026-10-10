import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork } from '../artwork/artwork';
import { Badge } from '../badge/badge';
import { ButtonLink } from '../button/button-link';
import { Icon } from '../icon/icon';
import { Rating } from '../rating/rating';

/**
 * The headliner (docs/design-system/components/headliner): the lineup's featured artist on a poster
 * frame with yellow artwork, the facts line, one review quote, the "Free {date}" stamp and the
 * profile link. An `<article>` named by the artist.
 */
@Component({
  selector: 'zm-headliner',
  imports: [Artwork, Badge, ButtonLink, Icon, Rating, RouterLink],
  templateUrl: './headliner.html',
  styleUrl: './headliner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Headliner {
  /** "No. 01 · Most booked this autumn". */
  readonly kicker = input.required<string>();
  readonly name = input.required<string>();
  readonly nameId = input('headliner-name');
  readonly link = input.required<string>();
  readonly queryParams = input<Record<string, string>>({});
  /** The art's tag: "Headliner". */
  readonly artTag = input.required<string>();
  /** "Solo vocalist · Hymns". */
  readonly actLine = input.required<string>();
  /** "Brampton · 44 km". */
  readonly placeLine = input.required<string>();
  /** "From $650". */
  readonly priceLine = input.required<string>();
  readonly rating = input.required<number | null>();
  readonly ratingLabel = input.required<string>();
  readonly ratingCount = input('');
  readonly ratingNew = input('');
  /** The review sentence, without quotation marks. */
  readonly quote = input<string | null>(null);
  /** "Rev. Janet Clarke, Oshawa". */
  readonly attribution = input('');
  /** "Free Sat 14 Nov". */
  readonly badge = input.required<string>();
  /** "See Abigail’s profile". */
  readonly profileLabel = input.required<string>();
}
