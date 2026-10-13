import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Checkbox } from 'components';

/** The drawn box on the admin review screen: "Reference verified" with its description. */
@Component({
  selector: 'zm-checkbox-check-scenario',
  imports: [Checkbox],
  template: `<zm-checkbox
    variant="check"
    id="ref-1"
    name="ref-1"
    description="Call or email them, then tick when they vouch for Tobi."
    >Reference verified</zm-checkbox
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxCheckScenario {}
