import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Calendar } from 'components';
import { LEGEND, novemberDays, WEEKDAYS } from './CalendarMonth';

/** Composite: the November calendar under `data-theme="dark"`, where every token resolves to its dark value. */
@Component({
  selector: 'zm-calendar-month-dark-scenario',
  imports: [Calendar],
  template: `<div data-theme="dark">
    <zm-calendar
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
    />
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CalendarMonthDarkScenario {
  protected readonly days = novemberDays();
  protected readonly weekdays = WEEKDAYS;
  protected readonly legend = LEGEND;
  protected readonly selected = ['2026-11-28', '2026-11-29'];
}
