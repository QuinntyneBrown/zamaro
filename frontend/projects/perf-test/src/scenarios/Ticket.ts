import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Ticket } from 'components';

/** Marcus Bell Trio's ticket (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-ticket-scenario',
  imports: [Ticket],
  template: `<ol role="list">
    <li>
      <zm-ticket
        positionLabel="No. 02"
        name="Marcus Bell Trio"
        link="/artists/marcus-bell-trio"
        [queryParams]="{ date: '2026-11-14' }"
        actLine="Band · Acoustic, Hymns"
        placeLine="Hamilton · 14 km from you"
        priceLabel="From"
        price="$950"
        [rating]="4.6"
        ratingLabel="Rated 4.6 out of 5 by 17 churches"
        ratingCount="17 churches"
        artVariant="group"
      />
    </li>
  </ol>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TicketScenario {}
