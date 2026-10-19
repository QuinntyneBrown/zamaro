import { expect, type Locator, type Page } from '@playwright/test';
import { AcceptTermsPage } from '../pages/accept-terms.page';
import { ApplicationPage } from '../pages/admin/application.page';
import { ApplicationsPage } from '../pages/admin/applications.page';
import { ArtistPage } from '../pages/admin/artist.page';
import { ArtistsPage } from '../pages/admin/artists.page';
import { AuditLogPage } from '../pages/admin/audit-log.page';
import { ChecksPage } from '../pages/admin/checks.page';
import { AccountPage } from '../pages/account.page';
import { ArtistWorkspacePage } from '../pages/artist-workspace.page';
import { AvailabilityPage } from '../pages/availability.page';
import { ArtistProfilePage } from '../pages/artist-profile.page';
import { DiscoverPage } from '../pages/discover.page';
import { MfaSetupPage } from '../pages/mfa-setup.page';
import { SavedPage } from '../pages/saved.page';
import { SignInPage } from '../pages/sign-in.page';
import { VerifyEmailPage } from '../pages/verify-email.page';
import type { RouteState } from '../routes.manifest';
import { RUTH, signIn, signInAs } from './accounts';
import { freezeClock } from './clock';

/** The wait the rate-limited state is given, as `Retry-After`, as in docs/mocks/pages/discover/limited. */
const RETRY_AFTER_SECONDS = 40;

/**
 * Opens a manifest state on a page set to the frozen "today", and resolves once it has settled.
 * Resolves with the parts a capture must mask: text the clock keeps changing.
 */
export async function openRouteState(page: Page, state: RouteState): Promise<Locator[]> {
  const discover = new DiscoverPage(page);
  const profile = new ArtistProfilePage(page);
  const slug = new URL(state.path, 'http://zamaro').pathname.split('/')[2] ?? '';
  await freezeClock(page);
  if (state.signedInAs) await signInAs(page.context(), state.signedInAs);
  if (state.masks === 'audit-times') await new AuditLogPage(page).withOlderEntries();

  switch (state.setup) {
    case 'search-pending':
      await discover.holdSearches();
      await page.goto(state.path);
      await expect(discover.lineup.skeletons().first()).toBeVisible();
      break;
    case 'submit-empty':
      await discover.openAndHydrate();
      await discover.form.showTheLineup();
      await expect(discover.form.errorSummary()).toBeVisible();
      break;
    case 'search-fails':
      await discover.failSearches();
      await page.goto(state.path);
      await expect(discover.lineup.alert()).toBeVisible();
      break;
    case 'search-limited':
      await discover.limitSearches(RETRY_AFTER_SECONDS);
      await page.goto(state.path);
      await expect(discover.lineup.alert()).toBeVisible();
      await discover.shell.settle();
      // "Try again in 39 s" counts down every second.
      return [discover.lineup.tryAgainButton()];
    case 'profile-pending':
    case 'profile-fails':
      await page.goto(state.from!, { waitUntil: 'networkidle' });
      await (state.setup === 'profile-pending'
        ? profile.holdProfile(slug)
        : profile.failProfile(slug));
      await profile.shell.followLinkTo(state.path);
      await expect(
        state.setup === 'profile-pending' ? profile.busyRegion() : profile.errorAlert(),
      ).toBeVisible();
      break;
    case 'two-step-on':
      await page.route('**/api/v1/me', async (route) => {
        const response = await route.fetch();
        const body = (await response.json()) as {
          data: Record<string, unknown>;
        };
        await route.fulfill({
          response,
          json: { data: { ...body.data, mfaEnabled: true } },
        });
      });
      await page.goto(state.path, { waitUntil: 'networkidle' });
      await expect(discover.shell.main()).toBeVisible();
      break;
    case 'last-search':
      await page.addInitScript(() => localStorage.setItem('zamaro.lastSearchDate', '2026-11-14'));
      await page.goto(state.path, { waitUntil: 'networkidle' });
      await expect(discover.shell.main()).toBeVisible();
      break;
    case 'application-pending':
    case 'application-fails':
    case 'application-verified':
    case 'application-approved': {
      const application = new ApplicationPage(page);
      const id = Number(state.path.split('/').pop());
      if (state.setup === 'application-pending') await application.holdApplication(id);
      if (state.setup === 'application-fails') await application.failApplication(id);
      if (state.setup === 'application-verified') await application.answerVerified(id);
      if (state.setup === 'application-approved') await application.answerApproved(id);
      // A held request never goes idle, so the loading state does not wait for the network.
      await page.goto(
        state.path,
        state.setup === 'application-pending' ? undefined : { waitUntil: 'networkidle' },
      );
      if (state.setup === 'application-pending') {
        await expect(application.loadingStatus()).toBeVisible();
      } else if (state.setup === 'application-fails') {
        await expect(application.errorAlert()).toBeVisible();
      }
      break;
    }
    case 'calendar-pending':
    case 'calendar-fails': {
      const availability = new AvailabilityPage(page);
      if (state.setup === 'calendar-pending') await availability.holdCalendar();
      else await availability.failCalendar();
      await page.goto(
        state.path,
        state.setup === 'calendar-pending' ? undefined : { waitUntil: 'networkidle' },
      );
      await expect(
        state.setup === 'calendar-pending'
          ? availability.loadingStatus()
          : availability.errorAlert(),
      ).toBeVisible();
      break;
    }
    case 'calendar-selected': {
      const availability = new AvailabilityPage(page);
      await page.goto(state.path, { waitUntil: 'networkidle' });
      await expect(availability.scheduleRows()).toHaveCount(6);
      await availability.selectDay('Sat 28 Nov, Free');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Space');
      await expect(availability.bulkBarCount()).toHaveText('2 days selected · Sat 28 – Sun 29 Nov');
      break;
    }
    case 'no-applications':
      await new ApplicationsPage(page).answerNoApplications();
      await page.goto(state.path, { waitUntil: 'networkidle' });
      break;
    case 'fresh-booker':
      await signIn(page.context().request, RUTH);
      await page.goto(state.path, { waitUntil: 'networkidle' });
      await expect(discover.shell.accountButton()).toBeVisible();
      break;
    default:
      await page.goto(state.path, { waitUntil: 'networkidle' });
      await expect(discover.shell.main()).toBeVisible();
  }
  // The browser asks who is signed in once it has taken over; the header changes when it answers.
  if (state.signedInAs) await expect(discover.shell.accountButton()).toBeVisible();
  // A slow start can begin the search after the network went quiet, so wait for its answer.
  if (state.shows === 'lineup') {
    await expect(discover.lineup.headliner().name()).toBeVisible();
    await expect(discover.lineup.tickets()).not.toHaveCount(0);
  }
  if (state.shows === 'sold-out') await expect(discover.lineup.soldOut().root()).toBeVisible();
  if (state.shows === 'link-expired')
    await expect(new VerifyEmailPage(page).expiredCard()).toBeVisible();
  if (state.shows === 'account-form') await expect(new AccountPage(page).form()).toBeVisible();
  if (state.shows === 'mfa-key') await expect(new MfaSetupPage(page).key()).toBeVisible();
  if (state.shows === 'saved-list') await expect(new SavedPage(page).cards()).toHaveCount(3);
  if (state.shows === 'saved-empty') await expect(new SavedPage(page).emptyTitle()).toBeVisible();
  if (state.shows === 'calendar')
    await expect(new AvailabilityPage(page).scheduleRows()).toHaveCount(6);
  if (state.shows === 'calendar-empty')
    await expect(new AvailabilityPage(page).emptyTitle()).toBeVisible();
  if (state.shows === 'artist-forbidden')
    await expect(new ArtistWorkspacePage(page).heading()).toBeVisible();
  if (state.shows === 'accept-terms')
    await expect(new AcceptTermsPage(page).changes()).toHaveCount(3);
  if (state.shows === 'audit-rows') await new AuditLogPage(page).waitForRows();
  if (state.shows === 'checks-rows') await new ChecksPage(page).waitForRows();
  if (state.shows === 'applications-rows') await new ApplicationsPage(page).waitForRows();
  if (state.shows === 'application-details') {
    const application = new ApplicationPage(page);
    await expect(application.reference(1).verifiedBox()).toBeVisible();
    await expect(application.decision()).toBeVisible();
  }
  if (state.shows === 'artists-rows') await new ArtistsPage(page).waitForRows();
  if (state.shows === 'artist-details') {
    const artist = new ArtistPage(page);
    await expect(artist.bookings().first()).toBeVisible();
    await expect(artist.standingBadge()).toBeVisible();
  }
  await discover.shell.settle();
  if (state.masks === 'mfa-key') {
    const setup = new MfaSetupPage(page);
    return [setup.qrCode(), setup.key()];
  }
  if (state.masks === 'devices') {
    // Other specs signed in as the same cast member add rows: keep this device (always first) so the
    // page's height does not depend on them, and mask its line and the count in the Password lead.
    // The lead is masked, but its count would still change how it wraps at 320 px, so it is given one
    // fixed count first.
    await page.addStyleTag({
      content: '.device-list > li:not(:first-child) { display: none !important; }',
    });
    const account = new AccountPage(page);
    await account.fixPasswordLeadCount();
    return [account.deviceList(), account.sectionLead('Password')];
  }
  if (state.masks === 'audit-times') {
    // Other admin specs add rows and the suite's own clock and address fill them: keep the first
    // two rows (Priya's sign-in) and mask their times and addresses.
    await page.addStyleTag({
      content: 'table.table tbody tr:nth-child(n + 3) { display: none !important; }',
    });
    const log = new AuditLogPage(page);
    return [log.rows().locator('th[scope="row"]'), log.rows().locator('td').nth(3)];
  }
  return state.masks === 'session-ended-line' ? [new SignInPage(page).sessionEndedDetail()] : [];
}
