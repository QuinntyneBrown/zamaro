import { expect, test } from '@playwright/test';
import {
  accounts,
  CAST_PASSWORD,
  createBooker,
  meStatusWith,
  signIn,
  signInAs,
} from '../../fixtures/accounts';
import { cast } from '../../fixtures/cast';
import { freezeClock } from '../../fixtures/clock';
import { DiscoverPage } from '../../pages/discover.page';
import { Session } from '../../pages/session';
import { SignInPage } from '../../pages/sign-in.page';

// L2-073.2 and .3, L2-109.2 (security/manage-sessions-and-csrf).
test.describe('CSRF', () => {
  test('a refused token is fetched again and the sign-out goes through once', async ({ page }) => {
    const discover = new DiscoverPage(page);
    const session = new Session(page);
    const booker = createBooker();
    await signIn(page.context().request, booker.email, booker.password);
    await discover.openAndHydrate();
    const sessionCookie = await new SignInPage(page).sessionCookie();
    await session.spoilCsrfToken();

    const menu = await discover.shell.openAccountMenu();
    await menu.signOut();

    await expect(discover.shell.signInLink()).toBeVisible();
    expect(session.signOutAnswers()).toEqual([419, 204]);
    expect(await meStatusWith(sessionCookie!)).toBe(401);
  });

  test('when the retry is refused too, a toast says so and Naomi stays signed in', async ({
    page,
  }) => {
    const discover = new DiscoverPage(page);
    const session = new Session(page);
    await signInAs(page.context(), 'naomi');
    await discover.openAndHydrate();
    await session.refuseSignOutAsCsrfMismatch();

    const menu = await discover.shell.openAccountMenu();
    await menu.signOut();

    const toast = discover.shell.toast('That didn’t go through.');
    await expect(toast.root).toBeVisible();
    await expect(toast.kind()).toHaveText('Failed');
    await expect(toast.text()).toHaveText('Reload the page and try again.');
    await expect(toast.root).toHaveClass(/toast--danger/);
    expect(session.signOutAnswers()).toEqual([419, 419]);
    await expect(discover.shell.accountButton()).toHaveText('NF');
  });
});

test.describe('A session that has ended', () => {
  test('sends the person to sign in again, keeping the page to return to', async ({ page }) => {
    const discover = new DiscoverPage(page);
    const session = new Session(page);
    const signInPage = new SignInPage(page);
    await signInAs(page.context(), 'naomi');
    await freezeClock(page);
    await discover.openLink({
      date: cast.search.date,
      kind: 'worship-night',
      lat: '43.325',
      lng: '-79.799',
      place: 'Burlington',
      radius: '120',
    });
    await expect(discover.shell.accountButton()).toBeVisible();
    await session.endOnServer();

    await discover.lineup.sortBy('Highest rated');

    await expect(signInPage.heading()).toHaveText('Sign in');
    await expect(signInPage.sessionEnded()).toContainText(
      'Sign in again to carry on. Nothing you typed is lost.',
    );
    const address = new URL(page.url());
    expect(address.searchParams.get('ended')).toBe('1');
    expect(address.searchParams.get('returnUrl')).toContain('sort=rating');
    await expect(signInPage.email()).toHaveValue(accounts.naomi.email);
    await expect(signInPage.password()).toBeFocused();
    await expect(discover.shell.accountButton()).toHaveCount(0);

    await session.answerNormally();
    await signInPage.signIn(accounts.naomi.email, CAST_PASSWORD);
    await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('rating');
    await expect(discover.shell.accountButton()).toBeVisible();
  });

  test('opened directly, the page says the session ended and starts in Email', async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.openAfterSessionEnded('/artists/abigail-mensah');

    await expect(signInPage.sessionEnded()).toContainText('Your session ended');
    await expect(signInPage.email()).toHaveValue('');
    await expect(signInPage.email()).toBeFocused();
  });
});
