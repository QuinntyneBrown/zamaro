import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Headliner } from 'components';

/** Abigail Mensah as the headliner (docs/mocks/pages/discover/default.html). */
@Component({
  selector: 'zm-headliner-scenario',
  imports: [Headliner],
  template: `<zm-headliner
    kicker="No. 01 · Most booked this autumn"
    name="Abigail Mensah"
    link="/artists/abigail-mensah"
    [queryParams]="{ date: '2026-11-14' }"
    artTag="Headliner"
    actLine="Solo vocalist · Hymns"
    placeLine="Brampton · 44 km"
    priceLine="From $650"
    [rating]="4.9"
    ratingLabel="Rated 4.9 out of 5 by 38 churches"
    ratingCount="38 churches"
    quote="She had the whole congregation singing in three-part harmony by the last verse."
    attribution="Rev. Janet Clarke, Oshawa"
    badge="Free Sat 14 Nov"
    profileLabel="See Abigail’s profile"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HeadlinerScenario {}
