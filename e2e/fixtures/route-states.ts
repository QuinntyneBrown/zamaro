import { expect, type Locator, type Page } from '@playwright/test';
import { ArtistProfilePage } from '../pages/artist-profile.page';
import { DiscoverPage } from '../pages/discover.page';
import { SignInPage } from '../pages/sign-in.page';
import { VerifyEmailPage } from '../pages/verify-email.page';
import type { RouteState } from '../routes.manifest';
import { signInAs } from './accounts';
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

  switch (state.setup) {
    case 'search-pending':
      await discover.holdSearches();
      await page.goto(state.path);
      await expect(discover.lineup.skeletons().first()).toBeVisible();
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
  await discover.shell.settle();
  return state.masks === 'session-ended-line' ? [new SignInPage(page).sessionEndedDetail()] : [];
}
