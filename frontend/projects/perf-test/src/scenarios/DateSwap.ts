import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DateSwap } from 'components';

/** The nearby dates in the sold-out empty state (docs/mocks/pages/discover/empty.html). */
@Component({
  selector: 'zm-date-swap-scenario',
  imports: [DateSwap],
  template: `<zm-date-swap heading="Nearby dates with choirs free" [options]="options" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DateSwapScenario {
  protected readonly options = [
    { date: '2026-12-23', label: 'Wed 23 Dec', count: '1 choir free' },
    { date: '2026-12-27', label: 'Sun 27 Dec', count: '3 choirs free' },
    { date: '2026-12-20', label: 'Sun 20 Dec', count: '2 choirs free' },
  ];
}
