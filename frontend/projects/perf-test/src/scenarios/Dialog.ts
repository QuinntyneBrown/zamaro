import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dialog } from 'components';

/** The drawer frame as the menu uses it, without the CDK overlay around it. */
@Component({
  selector: 'zm-dialog-scenario',
  imports: [Dialog],
  template: `<zm-dialog
    variant="drawer"
    heading="Menu"
    titleId="menu-title"
    closeLabel="Close menu"
  >
    <p>Saved artists and your account stay in the top bar.</p>
  </zm-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogScenario {}
