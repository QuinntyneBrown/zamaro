import { expect, test } from '@playwright/test';
import { signInAs } from '../../fixtures/accounts';
import { AvailabilityPage } from '../../pages/availability.page';
import { BlockDatesDialog } from '../../pages/block-dates.dialog';
import { Toasts } from '../../pages/toasts';
import { WeeklyDefaultDialog } from '../../pages/weekly-default.dialog';

// L2-056.2, L2-056.3, L2-057.1, L2-057.2, L2-057.3 and L2-109 (manage-availability-calendar): Abigail
// marks dates unavailable from the dialog and the bulk bar, is warned when a church has asked about
// one, and changes her weekly default. This changes the seed, so it runs in the zamaro-mutations
// project, one test at a time, and the project's teardown resets the database.
test.describe('Managing availability', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await signInAs(page.context(), 'abigail');
  });

  test('marks a range unavailable from the dialog; a Booked day in it stays booked (L2-057.1)', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new BlockDatesDialog(page);
    const toasts = new Toasts(page);
    await availability.open('2026-11');

    await availability.markDatesButton().click();
    await expect(dialog.heading()).toHaveText('Mark dates unavailable');
    await dialog.fill('2026-11-19', '2026-11-21', 'Rehearsal');
    await expect(dialog.summary()).toHaveText(
      '3 days: Thu 19 to Sat 21 Nov. No church has asked about these dates. Booked days in a range stay booked.',
    );
    await expect(dialog.actionButton()).toHaveText('Mark 3 days unavailable');
    const status = await dialog.save();

    expect(status).toBe(200);
    await expect(dialog.dialog()).toHaveCount(0);
    const toast = toasts.toast('Sat 21 Nov is still Booked');
    await expect(toast.kind()).toHaveText('Heads up');
    await expect(toast.text()).toHaveText(
      'Thu 19 and Fri 20 Nov are now Unavailable. Sat 21 Nov is booked with Kingdom Life Centre, so marking it will not free it.',
    );
    await expect(availability.day('Thu 19 Nov, Unavailable, Rehearsal')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(availability.day('Fri 20 Nov, Unavailable, Rehearsal')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(
      availability.day('Sat 21 Nov, Booked, Kingdom Life Centre. Booked dates can’t be changed'),
    ).toHaveAttribute('data-status', 'booked');
    await expect(availability.scheduleRows().filter({ hasText: 'Rehearsal' })).toHaveText(
      'Thu19 Nov Rehearsal Through Fri 20 NovUnavailable',
    );
    await expect(availability.markDatesButton()).toBeFocused();
  });

  test('the bulk bar marks selected days unavailable at once, and Undo puts them back (L2-109)', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    const toasts = new Toasts(page);
    await availability.open('2026-11');
    await availability.selectDay('Sat 28 Nov, Free');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(availability.bulkBarCount()).toHaveText('2 days selected · Sat 28 – Sun 29 Nov');

    await availability.markUnavailableButton().click();

    const toast = toasts.toast('28–29 Nov marked unavailable');
    await expect(toast.kind()).toHaveText('Saved');
    await expect(toast.text()).toHaveText('Churches won’t find you on Sat 28 or Sun 29 Nov.');
    await expect(availability.day('Sat 28 Nov, Unavailable')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(availability.day('Sun 29 Nov, Unavailable')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(availability.bulkBar()).toHaveCount(0);

    await toast.action('Undo').click();

    await expect(availability.day('Sat 28 Nov, Free')).toHaveAttribute('data-status', 'free');
    await expect(availability.day('Sun 29 Nov, Free')).toHaveAttribute('data-status', 'free');
    await expect(toasts.toast('28–29 Nov are Free again').locator()).toBeVisible();
  });

  test('the bulk bar offers Mark free over an Unavailable day, which overrides the weekly default (L2-056.2)', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    await availability.open('2026-11');

    await availability.selectDay('Mon 9 Nov, Unavailable, weekly default');
    await expect(availability.bulkBarCount()).toHaveText('1 day selected · Mon 9 Nov');
    await availability.markFreeButton().click();

    await expect(availability.day('Mon 9 Nov, Free')).toHaveAttribute('data-status', 'free');
    await expect(availability.day('Mon 16 Nov, Unavailable, weekly default')).toHaveAttribute(
      'data-status',
      'blocked',
    );
  });

  test('a failed save keeps every date Free and offers Try again', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new BlockDatesDialog(page);
    await availability.open('2026-11');
    await page.route('**/api/v1/artist/availability/dates', (route) => route.abort());

    await availability.markDatesButton().click();
    await dialog.fill('2026-11-24', '2026-11-25');
    await dialog.actionButton().click();

    await expect(dialog.failedAlert()).toContainText('Those dates weren’t saved');
    await expect(dialog.failedAlert()).toContainText(
      'Tue 24 and Wed 25 Nov are still Free to churches. Check your connection and try again.',
    );
    await expect(dialog.actionButton()).toHaveText('Try again');
    await dialog.wayBackButton().click();
    await expect(availability.day('Tue 24 Nov, Free')).toHaveAttribute('data-status', 'free');
  });

  test('an end date before the start date is refused in the dialog (L2-075)', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new BlockDatesDialog(page);
    await availability.open('2026-11');

    await availability.markDatesButton().click();
    await dialog.fill('2026-11-25', '2026-11-24');
    await dialog.actionButton().click();

    await expect(dialog.errorSummary()).toContainText('Check the dates');
    await expect(dialog.fieldError()).toHaveText('End date can’t be before the start date');
    await expect(dialog.endDate()).toHaveAttribute('aria-invalid', 'true');
  });

  test('marking a requested date warns, and confirming declines the request (L2-057.2)', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new BlockDatesDialog(page);
    await availability.open('2026-11');

    await availability.markDatesButton().click();
    await dialog.fill('2026-11-22', '2026-11-24', 'Family visiting');
    const first = await dialog.save();

    expect(first).toBe(409);
    await expect(dialog.warning()).toContainText(
      '1 church has asked about this date. They’ll be told you’re not available.',
    );
    await expect(dialog.warning()).toContainText(
      'St. Brendan’s Anglican asked for Sun 22 Nov. If you continue, their request becomes Declined and they’re shown 3 similar artists free that day.',
    );
    await expect(dialog.wayBackButton()).toHaveText('Keep Sun 22 Nov open');
    await expect(dialog.wayBackButton()).toBeFocused();
    await expect(dialog.actionButton()).toHaveText('Mark unavailable and decline');

    const second = await dialog.save();

    expect(second).toBe(200);
    await expect(dialog.dialog()).toHaveCount(0);
    await expect(availability.day('Sun 22 Nov, Unavailable, Family visiting')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(availability.scheduleRows().filter({ hasText: 'St. Brendan’s' })).toHaveCount(0);
    await expect(availability.subtitle()).toHaveText(
      'November 2026 · 3 booked · 1 requested · 1 free Saturday',
    );
  });

  test('the weekly default greys every future Tuesday until it is changed back (L2-056.2)', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new WeeklyDefaultDialog(page);
    await availability.open('2026-11');

    await availability.changeWeeklyDefaultButton().click();
    await expect(dialog.heading()).toHaveText('Weekly default');
    await expect(dialog.weekday('Monday')).toBeChecked();
    await dialog.weekday('Tuesday').check();
    const status = await dialog.save();

    expect(status).toBe(200);
    await expect(dialog.dialog()).toHaveCount(0);
    await expect(availability.weeklyDefault()).toContainText(
      'Weekly default: Unavailable every Monday and Tuesday',
    );
    await expect(availability.day('Tue 3 Nov, Unavailable, weekly default')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(availability.day('Tue 10 Nov, Unavailable, weekly default')).toHaveAttribute(
      'data-status',
      'blocked',
    );

    await availability.changeWeeklyDefaultButton().click();
    await dialog.weekday('Tuesday').uncheck();
    await dialog.save();

    await expect(availability.weeklyDefault()).toContainText(
      'Weekly default: Unavailable every Monday',
    );
    await expect(availability.day('Tue 3 Nov, Free')).toHaveAttribute('data-status', 'free');
  });

  test('a weekly default that fails to save keeps the ticks and names the old default', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new WeeklyDefaultDialog(page);
    await availability.open('2026-11');
    await page.route('**/api/v1/artist/availability/weekly', (route) => route.abort());

    await availability.changeWeeklyDefaultButton().click();
    await dialog.weekday('Wednesday').check();
    await dialog.actionButton().click();

    await expect(dialog.failedAlert()).toContainText('Your weekly default wasn’t saved');
    await expect(dialog.failedAlert()).toContainText(
      'Your calendar still uses Unavailable every Monday. Check your connection and try again.',
    );
    await expect(dialog.weekday('Wednesday')).toBeChecked();
    await expect(dialog.actionButton()).toHaveText('Try again');
  });
});
