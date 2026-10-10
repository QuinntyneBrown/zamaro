import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';

// L2-012.3, L2-017, L2-019, L2-020.1 and L2-044.1, with L2-098's pinned stub.
test.describe('Picking a date on a profile', () => {
  let profile: ArtistProfilePage;
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
    discover = new DiscoverPage(page);
    await discover.freezeClock();
  });

  test('"Upcoming dates" starts at the search date, skips her day off and hides who booked', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await expect(profile.datesKicker()).toHaveText('On tour');
    await expect(profile.datesHeading()).toHaveText('Upcoming dates');
    await expect(profile.datesNote()).toHaveText('Pick a free date to book it instead.');
    expect(await profile.tourDays()).toEqual([
      'Sat 14 Nov',
      'Sun 15 Nov',
      'Tue 17 Nov',
      'Wed 18 Nov',
      'Thu 19 Nov',
      'Fri 20 Nov',
    ]);

    const yourDate = profile.tourDate('Sat 14 Nov');
    await expect(profile.currentTourDate()).toHaveCount(1);
    await expect(profile.currentTourDate()).toContainText('Your date');
    await expect(yourDate.note()).toHaveText('Your date');
    await expect(yourDate.badge()).toHaveText('Free');
    await expect(yourDate.pickButton()).toHaveCount(0);

    const booked = profile.tourDate('Sun 15 Nov');
    await expect(booked.note()).toHaveText('Sunday service, Oakville');
    await expect(booked.badge()).toHaveText('Booked');
    await expect(booked.pickButton()).toHaveCount(0);
    await expect(profile.tourDates()).not.toContainText(['Lakeshore']);

    const free = profile.tourDate('Fri 20 Nov');
    await expect(free.note()).toHaveText('Open all day');
    await expect(free.badge()).toHaveText('Free');
    await expect(profile.pickButtons()).toHaveText(['Pick', 'Pick', 'Pick', 'Pick']);
    await expect(profile.pickButtons().first()).toHaveAccessibleName('Pick Tue 17 Nov');
  });

  test('the stub shows the ticket, price, fields and the policy, and checks the carried date', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await expect(profile.stub.region()).toBeVisible();
    await expect(profile.stub.title()).toHaveText('Book Abigail');
    await expect(profile.stub.code()).toHaveText('No. ACT-0027');
    await expect(profile.stub.price()).toHaveText('From $650');
    await expect(profile.stub.priceNote()).toHaveText('per service · travel included');
    await expect(profile.stub.fieldLabels()).toHaveText([
      'Event date',
      'Kind of gathering',
      'Church',
      'Message (optional)',
    ]);
    await expect(profile.stub.dateField()).toHaveValue('2026-11-14');
    await expect(profile.stub.dateField()).toHaveAccessibleDescription(
      'Abigail is free Sat 14 Nov',
    );
    await expect(profile.stub.kindField()).toHaveValue('sunday-service');
    await expect(profile.stub.finePrint()).toHaveText(
      'Nothing is charged until Abigail accepts. Cancel free up to 14 days before.',
    );
    await expect(profile.stub.policyLink()).toHaveText('Cancel free up to 14 days before');
    // Sending requests waits for M5: the submit stays behind the off bookingRequests flag.
    await expect(profile.stub.submitButton()).toHaveCount(0);
  });

  test('"Pick" moves the date into the stub and the Book button', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.pick('Fri 20 Nov');

    await expect(profile.stub.dateField()).toHaveValue('2026-11-20');
    await expect(profile.stub.dateField()).toBeFocused();
    await expect(profile.stub.dateField()).toHaveAccessibleDescription(
      'Abigail is free Fri 20 Nov',
    );
    await expect(profile.bookButton()).toHaveText('Book for Fri 20 Nov');
    await expect(profile.tourDate('Fri 20 Nov').note()).toHaveText('Your date');
    await expect(profile.tourDate('Fri 20 Nov').pickButton()).toHaveCount(0);
    await expect(profile.tourDate('Sat 14 Nov').pickButton()).toHaveAccessibleName(
      'Pick Sat 14 Nov',
    );
  });

  test('a booked date typed into the stub says so and the Book button follows it', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.stub.typeDate('2026-11-15');

    await expect(profile.stub.dateField()).toHaveAttribute('aria-invalid', 'true');
    await expect(profile.stub.dateField()).toHaveAccessibleDescription(
      'Abigail is booked Sun 15 Nov. Try another date.',
    );
    await expect(profile.bookButton()).toHaveText('Book for Sun 15 Nov');

    await profile.pick('Tue 17 Nov');
    await expect(profile.stub.dateField()).not.toHaveAttribute('aria-invalid', 'true');
    await expect(profile.stub.dateField()).toHaveAccessibleDescription(
      'Abigail is free Tue 17 Nov',
    );
  });

  test('with booking requests turned on, a booked date disables "Request to book"', async () => {
    await discover.openLink({
      date: cast.search.date,
      kind: 'worship-night',
      lat: '43.325',
      lng: '-79.799',
      place: 'Burlington',
      radius: '120',
    });
    await profile.turnOnBookingRequests();
    await discover.lineup.headliner().openProfile();

    // The stub carries the kind of gathering from the search.
    await expect(profile.stub.kindField()).toHaveValue('worship-night');
    await expect(profile.stub.submitButton()).toHaveText('Request to book · Sat 14 Nov');
    await expect(profile.stub.submitButton()).toBeEnabled();

    await profile.stub.typeDate('2026-11-15');

    await expect(profile.stub.submitButton()).toHaveText('Request to book · Sun 15 Nov');
    await expect(profile.stub.submitButton()).toBeDisabled();
  });

  test('without a search date: six free dates from three days out and "Check dates"', async () => {
    await profile.open('miriam-haile');

    await expect(profile.datesNote()).toHaveText('Miriam’s calendar is wide open this autumn.');
    expect(await profile.tourDays()).toEqual([
      'Mon 12 Oct',
      'Tue 13 Oct',
      'Wed 14 Oct',
      'Thu 15 Oct',
      'Fri 16 Oct',
      'Sat 17 Oct',
    ]);
    await expect(profile.currentTourDate()).toHaveCount(0);
    await expect(profile.pickButtons()).toHaveCount(6);
    await expect(profile.stub.title()).toHaveText('Book Miriam');
    await expect(profile.stub.code()).toHaveText('No. ACT-0154');
    await expect(profile.stub.price()).toHaveText('From $300');
    await expect(profile.stub.dateField()).toHaveValue('');
    await expect(profile.stub.dateField()).toHaveAccessibleDescription('');

    await profile.book();

    await expect(profile.stub.dateField()).toBeFocused();
  });

  test('"Ask Miriam for a recording" opens the stub with the message written', async () => {
    await profile.open('miriam-haile');

    await profile.askForRecording();

    await expect(profile.stub.messageField()).toBeFocused();
    await expect(profile.stub.messageField()).toHaveValue(
      'Could you send a recording of a recent set?',
    );
  });

  test('"Be her first booking" moves focus to the stub’s date', async () => {
    await profile.open('miriam-haile');

    await profile.beFirstBooking();

    await expect(profile.stub.dateField()).toBeFocused();
  });

  test('from LG the stub stays pinned while the profile scrolls', async () => {
    await profile.useWidth(1280);
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.scrollToReviews();

    expect(await profile.isInViewport(profile.stub.title())).toBe(true);
    expect(await profile.stub.topInViewport()).toBeGreaterThan(0);
    expect(await profile.stub.topInViewport()).toBeLessThan(200);
  });

  test('below LG the stub follows the reviews and the Book button scrolls to it', async () => {
    await profile.useWidth(375);
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    expect(await profile.stub.topOnPage()).toBeGreaterThanOrEqual(
      (await profile.reviewsBox()).bottom,
    );

    await profile.book();

    await expect(profile.stub.dateField()).toBeFocused();
    await expect.poll(() => profile.isInViewport(profile.stub.dateField())).toBe(true);
  });

  test('"Cancel free up to 14 days before" opens the full cancellation policy', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.stub.openPolicy();

    await expect(discover.policyHeading()).toHaveText('Cancellation policy');
    expect(discover.hash()).toBe('#how');
  });
});

// The "How booking works" and "For artists" sections that close Discover.
test.describe('How booking works', () => {
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discover = new DiscoverPage(page);
    await discover.freezeClock();
  });

  test('Discover explains the three steps and the cancellation policy', async () => {
    await discover.openAndHydrate();

    await expect(discover.howHeading()).toHaveText('How booking works');
    await expect(discover.howNote()).toHaveText('Cancel free up to 14 days before your event.');
    await expect(discover.stepTitles()).toHaveText([
      'Pick your date',
      'Send a request',
      'Lock it in',
    ]);
    await expect(discover.stepDescriptions()).toHaveText([
      'You only see artists who are free that day and will drive to you.',
      'Tell them about your church and the songs you love. Nothing is charged yet.',
      'When they accept, pay a 25% deposit. The rest is due after the event.',
    ]);
    await expect(discover.policyHeading()).toHaveText('Cancellation policy');
    await expect(discover.policyTerms()).toHaveText([
      '14 days or more before',
      'Fewer than 14 days before',
      'If the artist cancels',
    ]);
    await expect(discover.policyDetails()).toHaveText([
      'Cancel free. Your deposit comes back in full.',
      'Your deposit isn’t refunded. The balance is never charged.',
      'Everything you paid comes back.',
    ]);
  });

  test('"How booking works" and "For artists" in the header reach their sections', async () => {
    await discover.useWidth(1280);
    await discover.openAndHydrate();

    await discover.shell.followNavLink('How booking works');
    await expect.poll(() => discover.isInViewport(discover.howHeading())).toBe(true);

    await discover.shell.followNavLink('For artists');
    await expect.poll(() => discover.isInViewport(discover.band())).toBe(true);
    await expect(discover.bandKicker()).toHaveText('For artists');
    await expect(discover.band()).toContainText(
      'Your dates, your radius, your rate. Free to join; Zamaro keeps 8% when a church books you.',
    );
  });
});
