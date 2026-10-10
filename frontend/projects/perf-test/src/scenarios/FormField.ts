import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormField } from 'components';

/** The church location field in its error state (docs/mocks/pages/discover/invalid.html). */
@Component({
  selector: 'zm-form-field-scenario',
  imports: [FormField],
  template: `<zm-form-field
    fieldId="find-place"
    label="Church location"
    autocomplete="address-level2"
    error="Enter your church’s address or town, or pick a city below."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFieldScenario {}
