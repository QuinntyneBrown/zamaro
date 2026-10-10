import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Band, ButtonAnchor, Icon } from 'components';

/** The Discover band for artists, with its "Apply as an artist" action. */
@Component({
  selector: 'zm-band-scenario',
  imports: [Band, ButtonAnchor, Icon],
  template: `<zm-band
    kicker="For artists"
    title="Lead worship? Get on the bill."
    headingId="join-title"
  >
    <p>
      Your dates, your radius, your rate. Free to join; Zamaro keeps 8% when a church books you.
    </p>
    <zm-button-anchor slot="action" size="lg" href="#apply"
      >Apply as an artist <zm-icon name="arrow-right"
    /></zm-button-anchor>
  </zm-band>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BandScenario {}
