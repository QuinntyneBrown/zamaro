import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, FormActions } from 'components';

/** Account settings' sticky save bar (form-layout CRD): "Saved just now", Discard, Save changes. */
@Component({
  selector: 'zm-form-actions-scenario',
  imports: [Button, FormActions],
  template: `<zm-form-actions status="Saved just now" statusTone="success">
    <zm-button>Discard</zm-button>
    <zm-button variant="primary" type="submit">Save changes</zm-button>
  </zm-form-actions>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormActionsScenario {}
