import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Dialog } from 'components';

/**
 * "Turn off two-step sign-in?" (dialog CRD, danger): the red rule, the danger icon, the description
 * and the two footer buttons, without the CDK overlay around it.
 */
@Component({
  selector: 'zm-dialog-danger-scenario',
  imports: [Button, Dialog],
  template: `<zm-dialog
    danger
    icon="lock-open"
    iconTone="danger"
    kicker="Two-step sign-in"
    heading="Turn off two-step sign-in?"
    titleId="two-step-title"
    description="Enter a code to show it’s you."
    closeLabel="Close"
  >
    <p>You sign in with your password only.</p>
    <zm-button slot="footer">Keep it on</zm-button>
    <zm-button slot="footer" variant="danger" type="submit">Turn off</zm-button>
  </zm-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogDangerScenario {}
