import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Badge, ButtonLink, SAVE_TOGGLE_TEXT, SaveToggle, Ticket } from 'components';

const CAST = [
  [
    'Abigail Mensah',
    'Solo vocalist · Hymns',
    'Brampton · 44 km from you',
    '$650',
    'Saved Wed 7 Oct',
  ],
  [
    'Hosanna Collective',
    'Band · Hymns',
    'Mississauga · 32 km from you',
    '$1,800',
    'Saved Sun 27 Sep',
  ],
  [
    'Luz Viva',
    'Band · Acoustic, Spanish',
    'North York · 63 km from you',
    '$900',
    'Saved Sat 12 Sep',
  ],
] as const;

/**
 * Composite: a booker's whole shortlist on Saved artists, the 200-artist limit, the cast repeated:
 * each ticket with its kicker, a Free or Booked badge, Request or See free dates, and its heart.
 */
@Component({
  selector: 'zm-saved-lineup-scenario',
  imports: [Badge, ButtonLink, SaveToggle, Ticket],
  providers: [
    {
      provide: SAVE_TOGGLE_TEXT,
      useValue: {
        save: (name: string) => `Save ${name} to your saved artists`,
        remove: (name: string) => `Remove ${name} from your saved artists`,
        and: 'and',
      },
    },
  ],
  template: `<ol role="list" aria-label="Your saved artists, most recently saved first">
    @for (ticket of tickets; track $index) {
      <li>
        <zm-ticket
          [kicker]="ticket.kicker"
          [name]="ticket.name"
          [headingLevel]="2"
          link="/artists/abigail-mensah"
          [queryParams]="{ date: '2026-11-15' }"
          [actLine]="ticket.act"
          [placeLine]="ticket.place"
          priceLabel="From"
          [price]="ticket.price"
          [booked]="ticket.booked"
          artVariant="group"
        >
          @if (ticket.booked) {
            <zm-badge slot="actions" variant="booked">Booked Sun 15 Nov</zm-badge>
          } @else {
            <zm-badge slot="actions" variant="free">Free Sun 15 Nov</zm-badge>
          }
          @if (ticket.booked) {
            <zm-button-link
              slot="actions"
              size="sm"
              link="/artists/abigail-mensah"
              fragment="dates-title"
              >See free dates<span class="visually-hidden">
                for {{ ticket.name }}</span
              ></zm-button-link
            >
          } @else {
            <zm-button-link
              slot="actions"
              size="sm"
              link="/artists/abigail-mensah"
              [queryParams]="{ date: '2026-11-15' }"
              >Request<span class="visually-hidden">
                {{ ticket.name }} for Sun 15 Nov</span
              ></zm-button-link
            >
          }
          <zm-save-toggle [artistName]="ticket.name" [saved]="true" />
        </zm-ticket>
      </li>
    }
  </ol>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SavedLineupScenario {
  protected readonly tickets = Array.from({ length: 200 }, (_, index) => {
    const [name, act, place, price, kicker] = CAST[index % CAST.length];
    return { name, act, place, price, kicker, booked: index % CAST.length === 0 };
  });
}
