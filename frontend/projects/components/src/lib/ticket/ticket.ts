import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork } from '../artwork/artwork';
import { Rating } from '../rating/rating';

/**
 * An artist in the lineup as an admission ticket (docs/design-system/components/ticket): artwork,
 * body (kicker and rating, name, act and place lines, actions) and the perforated price stub. The
 * name links to the profile and its target covers the whole card. Put it inside an `<li>`. Project a
 * `zm-save-toggle` into the stub and badges or small buttons into `[slot=actions]`.
 */
@Component({
  selector: 'zm-ticket',
  imports: [Artwork, RouterLink, Rating],
  host: {
    class: 'ticket',
    '[class.ticket--booked]': 'booked()',
  },
  templateUrl: './ticket.html',
  styleUrl: './ticket.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ticket {
  /** "No. 02" or "Saved Wed 7 Oct". */
  readonly kicker = input.required<string>();
  readonly name = input.required<string>();
  readonly link = input.required<string>();
  readonly queryParams = input<Record<string, string>>({});
  /** "Band · Acoustic, Hymns". */
  readonly actLine = input.required<string>();
  /** "Hamilton · 14 km from you". */
  readonly placeLine = input.required<string>();
  /** "From". */
  readonly priceLabel = input.required<string>();
  /** "$950". */
  readonly price = input.required<string>();
  /** Undefined: no rating segment. Null: "New". */
  readonly rating = input<number | null | undefined>(undefined);
  /** "Rated 4.6 out of 5 by 17 churches". */
  readonly ratingLabel = input('');
  readonly ratingCount = input('');
  readonly ratingNew = input('');
  readonly artVariant = input<'solo' | 'group'>('solo');
  /** 2 on Saved artists, 3 under a section heading. */
  readonly headingLevel = input<2 | 3>(3);
  /** Not free on the chosen date: a quiet frame and muted name and price. */
  readonly booked = input(false, { transform: booleanAttribute });
}
