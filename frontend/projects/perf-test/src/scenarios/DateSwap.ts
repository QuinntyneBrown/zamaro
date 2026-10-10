import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DateSwap } from 'components';

/** The nearby dates in the sold-out empty state (docs/mocks/pages/discover/empty.html). */
@Component({
  selector: 'zm-date-swap-scenario',
  imports: [DateSwap],
  template: `<zm-date-swap heading="Nearby dates with choirs free" [dates]="dates" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DateSwapScenario {
  protected readonly dates = [
    { value: '2026-12-23', date: 'Wed 23 Dec', detail: '1 choir free' },
    { value: '2026-12-27', date: 'Sun 27 Dec', detail: '3 choirs free' },
    { value: '2026-12-20', date: 'Sun 20 Dec', detail: '2 choirs free' },
  ];
}
