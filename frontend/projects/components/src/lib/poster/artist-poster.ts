import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Artwork } from '../artwork/artwork';
import { Skeleton } from '../skeleton/skeleton';

/** One fact on the header line: "Brampton, ON". `hidden` keeps a visual repeat from being read twice. */
export interface PosterFact {
  readonly text: string;
  readonly hidden?: boolean;
}

/** The yellow figure first on the facts line: "★ 4.9", read as `label` when it has one. */
export interface PosterScore {
  readonly text: string;
  readonly label?: string;
}

/**
 * The artist's header on the charcoal stage (docs/design-system/components/poster, `.artist-poster`):
 * the breadcrumb, yellow artwork beside the kicker, the name set poster-size, the facts line and the
 * actions. Without `art` it is the error header (kicker and title only); `loading` holds skeletons
 * and keeps a hidden heading and status line. Project the breadcrumb into `[slot=breadcrumb]` and
 * buttons into `[slot=actions]`.
 */
@Component({
  selector: 'zm-artist-poster',
  imports: [Artwork, Skeleton],
  templateUrl: './artist-poster.html',
  styleUrls: ['./poster-frame.scss', './artist-poster.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistPoster {
  readonly headingId = input('artist-name');
  /** "Headliner · Gospel & contemporary vocalist"; "Show postponed" on the error header. */
  readonly kicker = input('');
  /** The artist's name; the error's title; the hidden heading while loading. */
  readonly name = input.required<string>();
  /** The artwork's figure; null shows the error header. */
  readonly art = input<'solo' | 'group' | null>(null);
  readonly score = input<PosterScore | null>(null);
  readonly facts = input<readonly PosterFact[]>([]);
  readonly loading = input(false);
  /** The status line announced while loading: "Loading the artist’s profile…". */
  readonly status = input('');
}
