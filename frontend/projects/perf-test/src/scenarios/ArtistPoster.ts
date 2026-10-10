import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArtistPoster, Button } from 'components';

/** Abigail's profile header (docs/mocks/pages/artist/default.html). */
@Component({
  selector: 'zm-artist-poster-scenario',
  imports: [ArtistPoster, Button],
  template: `<zm-artist-poster
    kicker="Headliner · Gospel & contemporary vocalist"
    name="Abigail Mensah"
    [artYellow]="true"
    [rating]="4.9"
    ratingLabel="Rated 4.9 out of 5 by 38 churches"
    ratingCount="38 churches"
    [facts]="facts"
  >
    <zm-button slot="actions" variant="primary">Book for Sat 14 Nov</zm-button>
  </zm-artist-poster>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArtistPosterScenario {
  protected readonly facts = ['Brampton, ON', 'Drives up to 120 km'];
}
