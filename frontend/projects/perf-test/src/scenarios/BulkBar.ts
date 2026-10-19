import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BulkBar, Button } from 'components';

/** The bar over Sat 28 and Sun 29 Nov selected (docs/mocks/pages/availability/selected.html). */
@Component({
  selector: 'zm-bulk-bar-scenario',
  imports: [BulkBar, Button],
  template: `<zm-bulk-bar
    label="Selected days"
    count="2 days selected · Sat 28 – Sun 29 Nov"
    sticky
  >
    <zm-button variant="primary" size="sm">Mark unavailable</zm-button>
    <zm-button size="sm">Clear</zm-button>
  </zm-bulk-bar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BulkBarScenario {}
