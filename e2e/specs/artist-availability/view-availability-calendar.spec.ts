import { expect, test } from '@playwright/test';
import { signInAs } from '../../fixtures/accounts';
import { AvailabilityPage } from '../../pages/availability.page';

// L2-056.1, L2-056.2, L2-056.4, L2-057.1 and L2-105 (artist-availability/manage-availability-calendar):
// an artist reads her own month, each day Free, Unavailable, Requested with a count or Booked, and
// selects Free days for the bulk bar.
test.describe('Viewing the availability calendar', () => {
  test('Abigail reads November: booked, requested and unavailable days with their names', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'abigail');

    await availability.open('2026-11');

    await expect(availability.heading()).toHaveText('Availability');
    await expect(availability.subtitle()).toHaveText(
      'November 2026 · 3 booked · 2 requested · 2 free Saturdays',
    );
    await expect(availability.monthHeading()).toHaveText('November 2026');
    await expect(availability.weeklyDefault()).toContainText(
      'Weekly default: Unavailable every Monday',
    );
    const booked = availability.day(
      'Sun 15 Nov, Booked, Lakeshore Alliance Church. Booked dates can’t be changed',
    );
    await expect(booked).toHaveAttribute('aria-disabled', 'true');
    await expect(booked).toHaveAttribute('data-status', 'booked');
    await expect(
      availability.day('Sat 14 Nov, Requested · 1, Riverside Community Church'),
    ).toHaveAttribute('data-status', 'requested');
    await expect(availability.day('Mon 16 Nov, Unavailable, weekly default')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(availability.day('Thu 26 Nov, Unavailable, Studio')).toHaveAttribute(
      'data-status',
      'blocked',
    );
    await expect(availability.day('Tue 3 Nov, Free')).toHaveAttribute('data-status', 'free');
    await expect(availability.days()).toHaveCount(30);
    await expect(availability.legend().getByRole('listitem')).toHaveText([
      'Free',
      'Requested',
      'Booked',
      'Unavailable',
    ]);
    await expect(availability.caption()).toHaveText(
      'Your calendar runs 18 months ahead, to Sun 9 Apr 2028, the last date churches can ask for.',
    );
  });

  test('the "In November" list names each booked, requested and unavailable date', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'abigail');

    await availability.open('2026-11');

    await expect(availability.scheduleHeading()).toHaveText('In November');
    await expect(availability.scheduleRows()).toHaveText([
      'Sun1 Nov Harvest Point Church Sunday service, MiltonConfirmed',
      'Sat14 Nov Riverside Community Church Requested · 1 · Worship nightRequested',
      'Sun15 Nov Lakeshore Alliance Church Sunday service, OakvilleConfirmed',
      'Sat21 Nov Kingdom Life Centre Worship night, MississaugaConfirmed',
      'Sun22 Nov St. Brendan’s Anglican Requested · 1 · Sunday serviceRequested',
      'Thu26 Nov Studio Through Fri 27 NovUnavailable',
    ]);
  });

  test('the pager runs from this month to the end of the window', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'abigail');

    await availability.open();

    await expect(availability.monthHeading()).toHaveText('October 2026');
    await expect(availability.previousMonthButton()).toBeDisabled();
    await availability.nextMonthButton().click();
    await expect(availability.monthHeading()).toHaveText('November 2026');
    expect(availability.location()).toBe('/artist/calendar?month=2026-11');
    await expect(availability.previousMonthButton()).toHaveAccessibleName(
      'Previous month, October 2026',
    );
    await expect(availability.nextMonthButton()).toHaveAccessibleName('Next month, December 2026');
  });

  test('selecting two Free days with the keyboard shows the bulk bar; Clear empties it', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'abigail');
    await availability.open('2026-11');

    await availability.selectDay('Sat 28 Nov, Free');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');

    await expect(availability.cellOf('Sat 28 Nov, Free')).toHaveAttribute('aria-selected', 'true');
    await expect(availability.cellOf('Sun 29 Nov, Free')).toHaveAttribute('aria-selected', 'true');
    await expect(availability.bulkBarCount()).toHaveText('2 days selected · Sat 28 – Sun 29 Nov');
    await expect(availability.markUnavailableButton()).toBeVisible();

    await availability.clearSelectionButton().click();

    await expect(availability.bulkBar()).toHaveCount(0);
    await expect(availability.cellOf('Sat 28 Nov, Free')).toHaveAttribute('aria-selected', 'false');
  });

  test('a Booked day cannot be selected and says so', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'abigail');
    await availability.open('2026-11');

    await availability.activateDay(
      'Sun 15 Nov, Booked, Lakeshore Alliance Church. Booked dates can’t be changed',
    );

    await expect(availability.shell.toasts()).toContainText('Sun 15 Nov is Booked');
    await expect(availability.shell.toasts()).toContainText(
      'It’s a Confirmed booking with Lakeshore Alliance Church, so it can’t be changed here.',
    );
    await expect(availability.bulkBar()).toHaveCount(0);
  });

  test('Miriam, who has set nothing, sees every day Free (L2-056.4)', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'miriam');

    await availability.open('2026-11');

    await expect(availability.subtitle()).toHaveText(
      'November 2026 · every date Free · nothing booked yet',
    );
    await expect(availability.emptyTitle()).toBeVisible();
    await expect(availability.weeklyDefault()).toContainText('Weekly default: none');
    await expect(availability.changeWeeklyDefaultButton()).toHaveText('Set a weekly default');
    await expect(availability.days()).toHaveCount(30);
    await expect(availability.grid().locator('[data-status="free"]')).toHaveCount(30);
  });

  test('/artist opens the calendar', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'abigail');

    await page.goto('/artist', { waitUntil: 'networkidle' });

    expect(availability.location()).toBe('/artist/calendar');
    await expect(availability.heading()).toHaveText('Availability');
  });

  test('a calendar that fails to load says nothing changed and offers Try again', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    await signInAs(page.context(), 'abigail');
    await availability.failCalendar();

    await availability.open('2026-11');

    await expect(availability.errorAlert()).toContainText('We couldn’t load your calendar');
    await expect(availability.tryAgainButton()).toBeVisible();
  });
});
