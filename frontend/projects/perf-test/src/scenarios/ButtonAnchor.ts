import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonAnchor } from 'components';

/** The search error's email link. */
@Component({
  selector: 'zm-button-anchor-scenario',
  imports: [ButtonAnchor],
  template: `<zm-button-anchor href="mailto:hello@zamaro.ca"
    >Email the Zamaro team</zm-button-anchor
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonAnchorScenario {}
