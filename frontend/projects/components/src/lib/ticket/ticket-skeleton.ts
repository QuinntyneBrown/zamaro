import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';

/**
 * A ticket while the lineup loads (docs/design-system/components/ticket, `.ticket--loading`): the
 * ticket's frame and tracks holding skeletons, without the hover lift, so the swap does not move the
 * page (L2-105.2). Put it inside an `<li>` of an `aria-hidden` list.
 */
@Component({
  selector: 'zm-ticket-skeleton',
  imports: [Skeleton],
  host: { class: 'ticket--loading' },
  template: `<zm-skeleton class="ticket__art" shape="block" />
    <div class="ticket__body">
      <zm-skeleton width="short" />
      <zm-skeleton shape="title" />
      <zm-skeleton />
    </div>
    <div class="ticket__stub">
      <zm-skeleton shape="title" width="short" />
      <zm-skeleton shape="target" />
    </div>`,
  styleUrl: './ticket.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketSkeleton {}
