import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox, CheckboxGroup } from 'components';

/** Tobi's styles (docs/mocks/pages/apply/step-2.html): six inline boxes, three ticked. */
@Component({
  selector: 'zm-checkbox-group-scenario',
  imports: [FormsModule, Checkbox, CheckboxGroup],
  template: `<zm-checkbox-group
    legend="Styles"
    name="styles"
    layout="inline"
    requiredMarker="(required, pick 1 to 4)"
    [ngModel]="['solo-vocalist', 'acoustic', 'hymns']"
  >
    @for (style of styles; track style.value) {
      <zm-checkbox [value]="style.value" [id]="'style-' + style.value">{{
        style.label
      }}</zm-checkbox>
    }
  </zm-checkbox-group>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxGroupScenario {
  protected readonly styles = [
    { value: 'band', label: 'Band' },
    { value: 'solo-vocalist', label: 'Solo vocalist' },
    { value: 'gospel-choir', label: 'Gospel choir' },
    { value: 'acoustic', label: 'Acoustic' },
    { value: 'hymns', label: 'Hymns' },
    { value: 'spanish', label: 'Spanish' },
  ];
}
