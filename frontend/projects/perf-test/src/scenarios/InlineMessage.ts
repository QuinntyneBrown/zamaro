import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InlineMessage } from 'components';

/** The booking stub's date check: "Abigail is free Sat 14 Nov". */
@Component({
  selector: 'zm-inline-message-scenario',
  imports: [InlineMessage],
  template: `<zm-inline-message id="date-help" variant="success" live
    >Abigail is free Sat 14 Nov</zm-inline-message
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InlineMessageScenario {}
