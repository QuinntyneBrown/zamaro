import type { Locator, Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/**
 * The artist's availability calendar at `/artist/calendar` (docs/mocks/pages/availability): one
 * month of Free, Unavailable, Requested and Booked days, the weekly default, the "In {month}" list
 * and the bulk bar over a selection.
 */
export class AvailabilityPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens the calendar on a month (`2026-11`), or on the current one. */
  async open(month?: string): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto(month ? `/artist/calendar?month=${month}` : '/artist/calendar', {
      waitUntil: 'networkidle',
    });
  }

  /** Opens the calendar without waiting for its requests, for a month that is held. */
  async openWithoutWaiting(month?: string): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto(month ? `/artist/calendar?month=${month}` : '/artist/calendar');
  }

  /** The path and query in the address bar. */
  location(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.search}`;
  }

  /** Keeps the calendar request pending, so the page stays in its loading state. */
  async holdCalendar(): Promise<void> {
    await this.page.route('**/api/v1/artist/calendar**', () => new Promise(() => undefined));
  }

  /** Answers the calendar request with a server error. */
  async failCalendar(): Promise<void> {
    await this.page.route('**/api/v1/artist/calendar**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Server error', status: 500 }),
      }),
    );
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "November 2026 · 3 booked · 2 requested · 2 free Saturdays". */
  subtitle(): Locator {
    return this.main().locator('.page-head__sub');
  }

  loadingStatus(): Locator {
    return this.main().getByRole('status').filter({ hasText: 'Loading your calendar' });
  }

  errorAlert(): Locator {
    return this.main().getByRole('alert');
  }

  tryAgainButton(): Locator {
    return this.errorAlert().getByRole('button', { name: 'Try again' });
  }

  markDatesButton(): Locator {
    return this.main().getByRole('button', { name: 'Mark dates unavailable' });
  }

  subscribeButton(): Locator {
    return this.main().getByRole('button', {
      name: 'Subscribe in your calendar',
    });
  }

  /** "Weekly default: Unavailable every Monday" with its button. */
  weeklyDefault(): Locator {
    return this.main().locator('.availability__weekly');
  }

  changeWeeklyDefaultButton(): Locator {
    return this.weeklyDefault().getByRole('button');
  }

  /** The "Every date is Free" state of a calendar with nothing set. */
  emptyTitle(): Locator {
    return this.main().getByRole('heading', {
      level: 2,
      name: 'Every date is Free',
    });
  }

  /** The month heading over the grid: "November 2026". */
  monthHeading(): Locator {
    return this.calendar().getByRole('heading', { level: 2 });
  }

  previousMonthButton(): Locator {
    return this.calendar().getByRole('button', { name: /^Previous month/ });
  }

  nextMonthButton(): Locator {
    return this.calendar().getByRole('button', { name: /^Next month/ });
  }

  grid(): Locator {
    return this.calendar().getByRole('grid');
  }

  /** A day by its accessible name: "Sat 14 Nov, Requested · 1, Riverside Community Church". */
  day(name: string | RegExp): Locator {
    return this.grid().getByRole('button', { name });
  }

  /** The days of the month that are buttons, in order. */
  days(): Locator {
    return this.grid().getByRole('button');
  }

  /** Selects a day the keyboard way: focus it, press Space. */
  async selectDay(name: string | RegExp): Promise<void> {
    await this.day(name).focus();
    await this.page.keyboard.press('Space');
  }

  /** The gridcell holding a day, whose `aria-selected` says whether it is selected. */
  cellOf(name: string | RegExp): Locator {
    return this.grid()
      .getByRole('gridcell')
      .filter({ has: this.page.getByRole('button', { name }) });
  }

  /** Activates a day the pointer way. A Booked day is `aria-disabled`, which the click goes past. */
  async activateDay(name: string | RegExp): Promise<void> {
    await this.day(name).click({ force: true });
  }

  legend(): Locator {
    return this.calendar().getByRole('list', { name: 'Legend' });
  }

  /** "Your calendar runs 18 months ahead, to Sun 9 Apr 2028, …". */
  caption(): Locator {
    return this.calendar().locator('.calendar__caption');
  }

  /** The bulk bar over a selection: "Selected days". */
  bulkBar(): Locator {
    return this.main().getByRole('region', { name: 'Selected days' });
  }

  /** "2 days selected · Sat 28 – Sun 29 Nov". */
  bulkBarCount(): Locator {
    return this.bulkBar().getByRole('status');
  }

  markUnavailableButton(): Locator {
    return this.bulkBar().getByRole('button', { name: 'Mark unavailable' });
  }

  markFreeButton(): Locator {
    return this.bulkBar().getByRole('button', { name: 'Mark free' });
  }

  clearSelectionButton(): Locator {
    return this.bulkBar().getByRole('button', { name: 'Clear' });
  }

  /** The "In {month}" heading. */
  scheduleHeading(): Locator {
    return this.main().getByRole('heading', { level: 2, name: /^In / });
  }

  /** The rows of the "In {month}" list. */
  scheduleRows(): Locator {
    return this.main().getByRole('list', { name: /^In / }).getByRole('listitem');
  }

  private calendar(): Locator {
    return this.main().getByRole('region', {
      name: 'Calendar, next 18 months',
    });
  }

  private main(): Locator {
    return this.page.getByRole('main');
  }
}
