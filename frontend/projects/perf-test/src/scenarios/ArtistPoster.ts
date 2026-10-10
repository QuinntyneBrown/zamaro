import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArtistPoster, Button } from 'components';

/** Abigail's profile header (docs/mocks/pages/artist/default.html). */
@Component({
  selector: 'zm-artist-poster-scenario',
  imports: [ArtistPoster, Button],
  template: `<zm-artist-poster
    kicker="Headliner · Gospel & contemporary vocalist"
    name="Abigail Mensah"
    art="solo"
    [score]="score"
    [facts]="facts"
  >
    <zm-button slot="actions" variant="primary">Book for Sat 14 Nov</zm-button>
  </zm-artist-poster>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArtistPosterScenario {
  protected readonly score = { text: '★ 4.9', label: 'Rated 4.9 out of 5 by 38 churches' };
  protected readonly facts = [
    { text: '38 churches', hidden: true },
    { text: 'Brampton, ON' },
    { text: 'Drives up to 120 km' },
  ];
}
