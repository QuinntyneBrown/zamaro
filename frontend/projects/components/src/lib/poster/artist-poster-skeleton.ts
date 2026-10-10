import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';

/**
 * The artist's header while the profile loads (docs/specs/components/poster.md): the stage and
 * breadcrumb, skeletons in the portrait and copy tracks, a hidden heading and the status line.
 */
@Component({
  selector: 'zm-artist-poster-skeleton',
  imports: [Skeleton],
  template: `<section class="poster on-stage" [attr.aria-labelledby]="headingId()">
    <div class="container stack stack--lg">
      <div class="artist-poster__crumbs"><ng-content select="[slot=breadcrumb]" /></div>
      <div class="artist-poster" aria-hidden="true">
        <zm-skeleton shape="portrait" />
        <div class="stack">
          <zm-skeleton width="short" />
          <zm-skeleton shape="poster" />
          <zm-skeleton shape="poster" width="medium" />
          <zm-skeleton />
        </div>
      </div>
      <h1 class="visually-hidden" [id]="headingId()">{{ heading() }}</h1>
      <p class="visually-hidden" role="status">{{ status() }}</p>
    </div>
  </section>`,
  styleUrls: ['./poster-frame.scss', './artist-poster.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistPosterSkeleton {
  /** The hidden heading: "Artist profile". */
  readonly heading = input.required<string>();
  /** "Loading the artist’s profile…". */
  readonly status = input.required<string>();
  readonly headingId = input('artist-name');
}
