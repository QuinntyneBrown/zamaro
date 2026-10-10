import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork } from '../artwork/artwork';
import { Rating } from '../rating/rating';

/**
 * An artist in the lineup as an admission ticket (docs/design-system/components/ticket): artwork,
 * body (position and rating, name, act and place lines) and the perforated price stub. The name
 * links to the profile and its target covers the whole card. Put it inside an `<li>`.
 */
@Component({
  selector: 'zm-ticket',
  imports: [Artwork, RouterLink, Rating],
  templateUrl: './ticket.html',
  styleUrl: './ticket.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ticket {
  /** "No. 02". */
  readonly positionLabel = input.required<string>();
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
  readonly rating = input.required<number | null>();
  readonly ratingLabel = input.required<string>();
  readonly ratingCount = input('');
  readonly ratingNew = input('');
  readonly artVariant = input<'solo' | 'group'>('solo');
}
