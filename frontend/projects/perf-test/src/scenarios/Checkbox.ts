import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Checkbox } from 'components';

/** Naomi's sign-up terms box: a choice row with the "(required)" marker (docs/mocks/pages/sign-up). */
@Component({
  selector: 'zm-checkbox-scenario',
  imports: [Checkbox],
  template: `<zm-checkbox name="terms" requiredMarker="(required)"
    >I accept Zamaro’s terms of use and privacy policy</zm-checkbox
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxScenario {}
