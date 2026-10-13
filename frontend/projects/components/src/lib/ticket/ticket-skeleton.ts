import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';

/**
 * A ticket that is still loading (ticket CRD D-5): the ticket's grid, stub and height filled with
 * skeleton blocks, and no lift. The page hides the list from assistive technology and announces the
 * loading itself.
 */
@Component({
  selector: 'zm-ticket-skeleton',
  imports: [Skeleton],
  host: { class: 'ticket ticket--loading', 'aria-hidden': 'true' },
  template: `<zm-skeleton shape="block" class="ticket__art" />
    <div class="ticket__body">
      <zm-skeleton width="short" />
      <zm-skeleton shape="title" />
      <zm-skeleton />
    </div>
    <div class="ticket__stub">
      <zm-skeleton shape="figure" />
      <zm-skeleton shape="target" />
    </div>`,
  styleUrl: './ticket.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketSkeleton {}
