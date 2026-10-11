import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormField, FormSection } from 'components';

/** Naomi's "Church" section on account settings (form-layout CRD): the lead and six fields. */
@Component({
  selector: 'zm-form-section-scenario',
  imports: [FormField, FormSection],
  template: `<zm-form-section heading="Church" headingId="church-title">
    <span slot="lead"
      >Artists see this on every request. Bookings already sent keep the address they were made
      with.</span
    >
    <div class="form-grid">
      <zm-form-field
        class="field--full"
        fieldId="church-name"
        label="Church name"
        requiredMarker="(required)"
        help="2 to 120 characters."
      />
      <zm-form-field
        fieldId="street"
        label="Street address"
        requiredMarker="(required)"
        help="Must be inside the Zamaro service area."
      />
      <zm-form-field fieldId="city" label="City" requiredMarker="(required)" />
      <zm-form-field fieldId="postal" label="Postal code" requiredMarker="(required)" />
      <zm-form-field
        fieldId="church-phone"
        type="tel"
        label="Contact phone"
        requiredMarker="(required)"
        help="A North American number."
      />
      <zm-form-field fieldId="denomination" label="Denomination" optionalMarker="(optional)" />
    </div>
  </zm-form-section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormSectionScenario {}
