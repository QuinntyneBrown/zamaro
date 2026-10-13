import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Badge,
  Stamp,
  type StampStatus,
  type TourDate,
  TourDates,
  TourDateTrail,
} from 'components';

interface ScheduleRow extends TourDate {
  stamp: StampStatus | null;
}

/** Abigail Mensah's "In November" schedule (docs/mocks/pages/availability/default.html): stamps and one Unavailable badge. */
@Component({
  selector: 'zm-tour-dates-schedule-scenario',
  imports: [Badge, Stamp, TourDates, TourDateTrail],
  template: `<zm-tour-dates variant="schedule" label="In November" [dates]="dates">
    <ng-template zmTourDateTrail let-row>
      @if (row.stamp) {
        <zm-stamp [status]="row.stamp">{{ stampText[row.stamp] }}</zm-stamp>
      } @else {
        <zm-badge>Unavailable</zm-badge>
      }
    </ng-template>
  </zm-tour-dates>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TourDatesScheduleScenario {
  protected readonly stampText: Record<string, string> = {
    confirmed: 'Confirmed',
    requested: 'Requested',
  };

  protected readonly dates: ScheduleRow[] = [
    {
      id: '2026-11-01',
      dayLabel: 'Sun',
      dayValue: '1 Nov',
      title: 'Harvest Point Church',
      note: 'Sunday service, Milton',
      stamp: 'confirmed',
    },
    {
      id: '2026-11-14',
      dayLabel: 'Sat',
      dayValue: '14 Nov',
      title: 'Riverside Community Church',
      titleLink: '/artist/requests/ZAM-0114',
      note: 'Requested · 1 · Worship night · reply by Mon 12 Oct',
      stamp: 'requested',
    },
    {
      id: '2026-11-15',
      dayLabel: 'Sun',
      dayValue: '15 Nov',
      title: 'Lakeshore Alliance Church',
      note: 'Sunday service, Oakville',
      stamp: 'confirmed',
    },
    {
      id: '2026-11-21',
      dayLabel: 'Sat',
      dayValue: '21 Nov',
      title: 'Kingdom Life Centre',
      note: 'Conference or retreat, Mississauga',
      stamp: 'confirmed',
    },
    {
      id: '2026-11-22',
      dayLabel: 'Sun',
      dayValue: '22 Nov',
      title: 'St. Brendan’s Anglican',
      titleLink: '/artist/requests/ZAM-0120',
      note: 'Requested · 1 · Sunday service · reply by Sun 11 Oct',
      stamp: 'requested',
    },
    {
      id: '2026-11-26',
      dayLabel: 'Thu',
      dayValue: '26 Nov',
      title: 'Studio',
      note: 'Through Fri 27 Nov',
      stamp: null,
    },
  ];
}
