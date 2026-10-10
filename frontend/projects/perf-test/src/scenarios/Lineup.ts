import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Ticket } from 'components';

const CAST = [
  ['Marcus Bell Trio', 'Band · Acoustic, Hymns', 'Hamilton · 14 km from you', '$950', 4.6, 17],
  ['Hosanna Collective', 'Band · Hymns', 'Mississauga · 32 km from you', '$1,800', 4.8, 21],
  ['Abigail Mensah', 'Solo vocalist · Hymns', 'Brampton · 44 km from you', '$650', 4.9, 38],
  ['Luz Viva', 'Band · Acoustic, Spanish', 'North York · 63 km from you', '$900', 5.0, 6],
  ['Elijah Park', 'Solo vocalist · Acoustic', 'Markham · 74 km from you', '$350', 4.7, 9],
  [
    'Grace Tabernacle Mass Choir',
    'Gospel choir',
    'Scarborough · 81 km from you',
    '$2,400',
    4.8,
    26,
  ],
] as const;

/** Composite: a full page of 24 tickets in the Discover results, the cast repeated. */
@Component({
  selector: 'zm-lineup-scenario',
  imports: [Ticket],
  template: `<ol role="list" aria-label="Artists free Saturday 14 November 2026">
    @for (ticket of tickets; track $index) {
      <li>
        <zm-ticket
          [positionLabel]="ticket.position"
          [name]="ticket.name"
          link="/artists/abigail-mensah"
          [queryParams]="{ date: '2026-11-14' }"
          [actLine]="ticket.act"
          [placeLine]="ticket.place"
          priceLabel="From"
          [price]="ticket.price"
          [rating]="ticket.rating"
          [ratingLabel]="ticket.label"
          [ratingCount]="ticket.count"
          artVariant="group"
        />
      </li>
    }
  </ol>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LineupScenario {
  protected readonly tickets = Array.from({ length: 24 }, (_, index) => {
    const [name, act, place, price, rating, reviews] = CAST[index % CAST.length];
    return {
      position: `No. ${String(index + 1).padStart(2, '0')}`,
      name,
      act,
      place,
      price,
      rating,
      label: `Rated ${rating.toFixed(1)} out of 5 by ${reviews} churches`,
      count: `${reviews} churches`,
    };
  });
}
