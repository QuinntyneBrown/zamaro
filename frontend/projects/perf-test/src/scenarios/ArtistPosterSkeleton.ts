import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArtistPosterSkeleton } from 'components';

/** The profile header while it loads (docs/mocks/pages/artist/loading.html). */
@Component({
  selector: 'zm-artist-poster-skeleton-scenario',
  imports: [ArtistPosterSkeleton],
  template: `<zm-artist-poster-skeleton
    heading="Artist profile"
    status="Loading the artist’s profile…"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArtistPosterSkeletonScenario {}
