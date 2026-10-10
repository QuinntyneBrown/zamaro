import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type TourDate, TourDates } from 'components';

/** Abigail Mensah's six upcoming dates from Sat 14 Nov: her date, a booked Sunday, four Picks. */
@Component({
  selector: 'zm-tour-dates-scenario',
  imports: [TourDates],
  template: `<zm-tour-dates
    label="Upcoming dates"
    freeText="Free"
    bookedText="Booked"
    pickText="Pick"
    [dates]="dates"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TourDatesScenario {
  protected readonly dates: TourDate[] = [
    {
      id: '2026-11-14',
      dayLabel: 'Sat',
      dayValue: '14 Nov',
      current: true,
      status: 'free',
      note: 'Your date',
    },
    {
      id: '2026-11-15',
      dayLabel: 'Sun',
      dayValue: '15 Nov',
      status: 'booked',
      note: 'Sunday service, Oakville',
    },
    ...['17', '18', '19', '20'].map((day, index) => ({
      id: `2026-11-${day}`,
      dayLabel: ['Tue', 'Wed', 'Thu', 'Fri'][index],
      dayValue: `${day} Nov`,
      status: 'free' as const,
      note: 'Open all day',
      pickLabel: `Pick ${['Tue', 'Wed', 'Thu', 'Fri'][index]} ${day} Nov`,
    })),
  ];
}
