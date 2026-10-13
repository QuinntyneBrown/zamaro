import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Radio, RadioGroup } from 'components';

/** Tobi's act type (docs/mocks/pages/apply/default.html): four inline choices, Solo chosen. */
@Component({
  selector: 'zm-radio-group-scenario',
  imports: [FormsModule, Radio, RadioGroup],
  template: `<zm-radio-group
    legend="Act type"
    name="act"
    layout="inline"
    requiredMarker="(required)"
    [ngModel]="'solo'"
  >
    <zm-radio value="solo">Solo</zm-radio>
    <zm-radio value="duo">Duo</zm-radio>
    <zm-radio value="band">Band</zm-radio>
    <zm-radio value="choir">Choir</zm-radio>
  </zm-radio-group>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioGroupScenario {}
