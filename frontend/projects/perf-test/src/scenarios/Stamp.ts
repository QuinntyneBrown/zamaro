import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Stamp } from 'components';

/** The "Accepted" stamp on Luz Viva's row in Naomi's bookings (docs/mocks/pages/bookings/default). */
@Component({
  selector: 'zm-stamp-scenario',
  imports: [Stamp],
  template: `<zm-stamp status="accepted">Accepted</zm-stamp>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StampScenario {}
