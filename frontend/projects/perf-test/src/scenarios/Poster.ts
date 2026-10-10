import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Poster } from 'components';

/** The Discover hero after Naomi's search (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-poster-scenario',
  imports: [Poster],
  template: `<zm-poster
    kicker="Worship artists within driving distance of Toronto"
    heading="Who’s free"
    date="Sat 14 Nov"
    subtitle="Seven artists are free that Saturday and will drive to Burlington."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PosterScenario {}
