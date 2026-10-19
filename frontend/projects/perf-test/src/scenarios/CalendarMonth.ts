import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Calendar,
  type CalendarGridDay,
  type CalendarLegendItem,
  type CalendarWeekday,
} from 'components';

/** Abigail Mensah's November 2026 (docs/mocks/pages/availability/default.html), as the grid reads it. */
export function novemberDays(): CalendarGridDay[] {
  const special: Record<number, Partial<CalendarGridDay> & { status: CalendarGridDay['status'] }> =
    {
      1: {
        status: 'booked',
        label: 'Sun 1 Nov, Booked, Harvest Point Church. Booked dates can’t be changed',
        event: 'Harvest Point',
        selectable: false,
      },
      14: {
        status: 'requested',
        label: 'Sat 14 Nov, Requested · 1, Riverside Community Church',
        event: 'Requested · 1',
      },
      15: {
        status: 'booked',
        label: 'Sun 15 Nov, Booked, Lakeshore Alliance Church. Booked dates can’t be changed',
        event: 'Lakeshore',
        selectable: false,
      },
      21: {
        status: 'booked',
        label: 'Sat 21 Nov, Booked, Kingdom Life Centre. Booked dates can’t be changed',
        event: 'Kingdom Life',
        selectable: false,
      },
      22: {
        status: 'requested',
        label: 'Sun 22 Nov, Requested · 1, St. Brendan’s Anglican',
        event: 'Requested · 1',
      },
      26: { status: 'blocked', label: 'Thu 26 Nov, Unavailable, Studio', event: 'Studio' },
      27: { status: 'blocked', label: 'Fri 27 Nov, Unavailable, Studio', event: 'Studio' },
    };
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    const date = `2026-11-${String(number).padStart(2, '0')}`;
    const weekday = weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()];
    if (weekday === 'Mon') {
      return {
        date,
        status: 'blocked',
        label: `${weekday} ${number} Nov, Unavailable, weekly default`,
        event: 'Weekly',
      };
    }
    const day = special[number];
    return day
      ? {
          date,
          status: day.status,
          label: day.label ?? '',
          event: day.event,
          selectable: day.selectable,
        }
      : { date, status: 'free', label: `${weekday} ${number} Nov, Free` };
  });
}

export const WEEKDAYS: CalendarWeekday[] = [
  { short: 'Sun', long: 'Sunday' },
  { short: 'Mon', long: 'Monday' },
  { short: 'Tue', long: 'Tuesday' },
  { short: 'Wed', long: 'Wednesday' },
  { short: 'Thu', long: 'Thursday' },
  { short: 'Fri', long: 'Friday' },
  { short: 'Sat', long: 'Saturday' },
];

export const LEGEND: CalendarLegendItem[] = [
  { status: 'free', label: 'Free' },
  { status: 'requested', label: 'Requested' },
  { status: 'booked', label: 'Booked' },
  { status: 'blocked', label: 'Unavailable' },
];

/** Composite: one month of the availability calendar with two days selected. */
@Component({
  selector: 'zm-calendar-month-scenario',
  imports: [Calendar],
  template: `<zm-calendar
    label="Calendar, next 18 months"
    month="2026-11"
    monthTitle="November 2026"
    [days]="days"
    [weekdays]="weekdays"
    [legend]="legend"
    legendLabel="Legend"
    previousLabel="Previous month, October 2026"
    nextLabel="Next month, December 2026"
    [selected]="selected"
  >
    <p class="calendar__caption">
      Your calendar runs 18 months ahead, to Sun 9 Apr 2028, the last date churches can ask for.
    </p>
  </zm-calendar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CalendarMonthScenario {
  protected readonly days = novemberDays();
  protected readonly weekdays = WEEKDAYS;
  protected readonly legend = LEGEND;
  protected readonly selected = ['2026-11-28', '2026-11-29'];
}
