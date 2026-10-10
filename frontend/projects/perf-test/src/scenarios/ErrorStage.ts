import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, ErrorStage } from 'components';

/** The profile that didn’t load (docs/mocks/pages/artist/error.html). */
@Component({
  selector: 'zm-error-stage-scenario',
  imports: [Button, ErrorStage],
  template: `<zm-error-stage
    kicker="Show postponed"
    heading="This profile didn’t load"
    alertHeading="We couldn’t reach the artist’s page"
  >
    <p>It’s on our side, not yours. Your search is saved and any request you’ve sent is safe.</p>
    <zm-button slot="actions" variant="primary">Try again</zm-button>
  </zm-error-stage>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ErrorStageScenario {}
