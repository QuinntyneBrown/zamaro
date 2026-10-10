import { expect, test } from '@playwright/test';
import {
  accounts,
  CAST_PASSWORD,
  createBooker,
  meStatusWith,
  signIn as signInWith,
  signInAs,
  uniqueEmail,
} from '../../fixtures/accounts';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';
import { SignInPage } from '../../pages/sign-in.page';

// L2-023.1–.2, L2-073.1, L2-108.1 and .3 (sign-in-and-recover-access).
test.describe('Signing in', () => {
  let signIn: SignInPage;

  test.beforeEach(async ({ page }) => {
    signIn = new SignInPage(page);
  });

  test('Naomi signs in from Abigail’s profile and returns to it', async ({ page }) => {
    await signIn.open('/artists/abigail-mensah?date=2026-11-14');
    await expect(signIn.heading()).toHaveText('Sign in');
    await expect(signIn.email()).toBeFocused();

    await signIn.signIn(accounts.naomi.email, CAST_PASSWORD);

    await expect(new ArtistProfilePage(page).name()).toHaveText('Abigail Mensah');
    expect(signIn.address()).toBe('/artists/abigail-mensah?date=2026-11-14');
  });

  test('the session cookie is HttpOnly, Secure and SameSite=Lax', async () => {
    await signIn.open();

    await signIn.signIn(accounts.naomi.email, CAST_PASSWORD);

    await expect.poll(() => signIn.address()).toBe('/');
    expect(await signIn.sessionCookie()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    });
  });

  test('a return address on another site is ignored', async () => {
    await signIn.open('https://example.com/phish');

    await signIn.signIn(accounts.naomi.email, CAST_PASSWORD);

    await expect.poll(() => signIn.address()).toBe('/');
  });

  test('a wrong password says only that the email or password is incorrect', async () => {
    const booker = createBooker();
    await signIn.open();

    await signIn.signIn(booker.email, 'not-the-right-password');

    await expect(signIn.errorSummaryTitle()).toHaveText('Couldn’t sign you in');
    await expect(signIn.errorSummaryLinks()).toHaveText(['Email or password is incorrect.']);
    await expect(signIn.errorSummary()).toBeFocused();
    await expect(signIn.credentialsError()).toHaveText('Email or password is incorrect.');
    await expect(signIn.email()).toHaveValue(booker.email);
    await expect(signIn.password()).toHaveValue('');
    await expect(signIn.email()).toHaveAttribute('aria-invalid', 'true');
    await expect(signIn.password()).toHaveAttribute('aria-invalid', 'true');
    await expect(signIn.password()).toHaveAccessibleDescription('Email or password is incorrect.');
  });

  test('an email with no account gets the same answer', async () => {
    const email = uniqueEmail('nobody');
    await signIn.open();

    await signIn.signIn(email, 'not-the-right-password');

    await expect(signIn.errorSummaryTitle()).toHaveText('Couldn’t sign you in');
    await expect(signIn.credentialsError()).toHaveText('Email or password is incorrect.');
    await expect(signIn.email()).toHaveValue(email);
    await expect(signIn.password()).toHaveValue('');
  });

  test('while signing in the button is busy and the fields are read-only', async () => {
    await signIn.open();
    await signIn.holdSignIn();

    await signIn.signIn(accounts.naomi.email, CAST_PASSWORD);

    await expect(signIn.submitButton()).toHaveText('Signing in…');
    await expect(signIn.submitButton()).toHaveAttribute('aria-busy', 'true');
    await expect(signIn.submitButton()).toHaveAttribute('aria-disabled', 'true');
    await expect(signIn.email()).toHaveAttribute('readonly');
    await expect(signIn.password()).toHaveAttribute('readonly');
  });

  test('when Zamaro does not answer, the error says so and keeps what was typed', async () => {
    await signIn.open();
    await signIn.failSignIn();

    await signIn.signIn(accounts.naomi.email, CAST_PASSWORD);

    await expect(signIn.alertTitle()).toHaveText('We couldn’t sign you in');
    await expect(signIn.alert()).toContainText(
      'Zamaro didn’t answer. Your email is still here; try again in a minute.',
    );
    await expect(signIn.email()).toHaveValue(accounts.naomi.email);
    await expect(signIn.password()).toHaveValue(CAST_PASSWORD);
    await expect(signIn.submitButton()).toHaveText('Sign in');
  });
});

// L2-023.1 and .5, L2-024.2 (initials and name), L2-099.1, L2-101.4.
test.describe('The signed-in header and footer', () => {
  test('a guest finds Sign in in the header and in the footer', async ({ page }) => {
    const discover = new DiscoverPage(page);

    await discover.openAndHydrate();

    await expect(discover.shell.signInLink()).toBeVisible();
    await expect(discover.shell.accountButton()).toHaveCount(0);
    await expect(discover.shell.footerHeadings()).toHaveText([
      'Churches',
      'Artists',
      'Your account',
    ]);
    await expect(discover.shell.footerColumn('Your account')).toHaveText([
      'Sign in',
      'Create an account',
    ]);
  });

  test('Sign in in the header returns the guest to the page they were on', async ({ page }) => {
    const profile = new ArtistProfilePage(page);
    const signIn = new SignInPage(page);
    await profile.open('abigail-mensah', '2026-11-14');

    await profile.shell.signInFromHeader();
    await expect(signIn.heading()).toHaveText('Sign in');
    await signIn.signIn(accounts.naomi.email, CAST_PASSWORD);

    await expect(profile.name()).toHaveText('Abigail Mensah');
    expect(signIn.address()).toBe('/artists/abigail-mensah?date=2026-11-14');
  });

  test('after the page loads, Naomi’s header shows NF and the footer names her', async ({
    page,
  }) => {
    const discover = new DiscoverPage(page);
    await signInAs(page.context(), 'naomi');

    await discover.openAndHydrate();

    await expect(discover.shell.accountButton()).toHaveText('NF');
    await expect(discover.shell.accountButton()).toHaveAccessibleName(
      'Account menu for Naomi Fraser',
    );
    await expect(discover.shell.signInLink()).toHaveCount(0);
    await expect(discover.shell.footerHeadings()).toHaveText([
      'Churches',
      'Artists',
      'Naomi Fraser',
    ]);
  });

  test('the server never renders Naomi’s name into the page', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await signInAs(page.context(), 'naomi');

    const html = await discover.shell.serverRenderedHtml('/');

    expect(html).not.toContain('Naomi Fraser');
    expect(html).not.toContain(accounts.naomi.email);
  });

  test('at 320 px her initials stay in the header beside the menu button', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await signInAs(page.context(), 'naomi');
    await discover.useWidth(320);

    await discover.openAndHydrate();

    await expect(discover.shell.menuButton()).toBeVisible();
    await expect(discover.shell.accountButton()).toBeVisible();
    expect(await discover.shell.hasHorizontalScroll()).toBe(false);
  });
});

test.describe('The account menu', () => {
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discover = new DiscoverPage(page);
    await signInAs(page.context(), 'naomi');
    await discover.openAndHydrate();
  });

  test('lists Naomi, her email, Account settings and Sign out', async () => {
    const menu = await discover.shell.openAccountMenu();

    await expect(menu.dialog()).toHaveAccessibleName('Account menu for Naomi Fraser');
    await expect(menu.whoName()).toHaveText('Naomi Fraser');
    await expect(menu.who()).toContainText(accounts.naomi.email);
    await expect(menu.items()).toHaveText(['Account settings', 'Sign out']);
    await expect(menu.link('Your bookings')).toHaveCount(0);
    await expect(menu.items().first()).toBeFocused();
    await expect(discover.shell.accountButton()).toHaveAttribute('aria-expanded', 'true');
  });

  test('Tab moves through the items and Escape returns focus to the avatar', async () => {
    const menu = await discover.shell.openAccountMenu();
    await expect(menu.items().first()).toBeFocused();

    await menu.pressTab();
    await expect(menu.signOutButton()).toBeFocused();

    await menu.closeWithEscape();
    await expect(menu.dialog()).toBeHidden();
    await expect(discover.shell.accountButton()).toBeFocused();
    await expect(discover.shell.accountButton()).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Signing out', () => {
  test('ends the session on the server and the header shows Sign in again', async ({ page }) => {
    const discover = new DiscoverPage(page);
    const booker = createBooker();
    await signInWith(page.context().request, booker.email, booker.password);
    await discover.openAndHydrate();
    const session = await new SignInPage(page).sessionCookie();

    const menu = await discover.shell.openAccountMenu();
    await menu.signOut();

    await expect(discover.shell.signInLink()).toBeVisible();
    await expect(discover.shell.accountButton()).toHaveCount(0);
    await expect(menu.dialog()).toBeHidden();
    expect(await meStatusWith(session!)).toBe(401);
  });
});
