import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TicketSkeleton } from 'components';

/** One loading ticket in the Discover lineup (docs/mocks/pages/discover/loading.html). */
@Component({
  selector: 'zm-ticket-skeleton-scenario',
  imports: [TicketSkeleton],
  template: `<ul role="list" aria-hidden="true">
    <li><zm-ticket-skeleton /></li>
  </ul>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TicketSkeletonScenario {}
