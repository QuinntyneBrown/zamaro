import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Alert, Button, ButtonAnchor, Icon } from 'components';

/** The Discover search error (docs/mocks/pages/discover/error.html). */
@Component({
  selector: 'zm-alert-scenario',
  imports: [Alert, Button, ButtonAnchor, Icon],
  template: `<zm-alert variant="danger" heading="We lost the signal">
    <p>
      We couldn’t load who’s free on Saturday 14 November 2026. Your date, location and filters are
      kept.
    </p>
    <zm-button slot="actions" variant="primary"><zm-icon name="refresh" />Try again</zm-button>
    <zm-button-anchor slot="actions" href="mailto:hello@zamaro.ca"
      >Email the Zamaro team</zm-button-anchor
    >
  </zm-alert>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlertScenario {}
