import { expect, test } from '@playwright/test';
import {
  accounts,
  CAST_PASSWORD,
  createBooker,
  failSignIns,
  meStatusWith,
  signIn as signInWith,
  signInAs,
  uniqueEmail,
} from '../../fixtures/accounts';
import { emailsTo, linkIn, waitForEmail } from '../../fixtures/mailbox';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';
import { ForgotPasswordPage } from '../../pages/forgot-password.page';
import { ResetPasswordPage } from '../../pages/reset-password.page';
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

    await signIn.enter(accounts.naomi.email, CAST_PASSWORD);

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

// L2-072.4 (sign-in-and-recover-access): 5 failures in 15 minutes pause sign-in for an address.
test.describe('Sign-in paused after too many tries', () => {
  test('the 6th try is refused with the time it resumes, and the owner is emailed once', async ({
    page,
  }) => {
    const booker = createBooker(uniqueEmail('paused'));
    const signIn = new SignInPage(page);
    await failSignIns(page.request, booker.email, 5);
    await signIn.open();

    await signIn.signIn(booker.email, booker.password);

    await expect(signIn.alertTitle()).toHaveText('Sign-in is paused for 15 minutes');
    await expect(signIn.alertText()).toHaveText(
      'There were too many tries for this email. Try again after 10:15 a.m., or reset your password now.',
    );
    await expect(signIn.finePrint()).toHaveText(
      'If this wasn’t you, the account owner has been emailed.',
    );
    await expect(signIn.resetPasswordLink()).toHaveAttribute('href', '/forgot-password');
    await expect(signIn.createAccountLink()).toBeVisible();
    await expect(signIn.email()).toHaveValue(booker.email);
    await waitForEmail(booker.email, 'Sign-in to your Zamaro account is paused');
    await signIn.signIn(booker.email, booker.password);
    await expect(signIn.alertTitle()).toHaveText('Sign-in is paused for 15 minutes');
    expect(
      (await emailsTo(booker.email)).filter((email) => email.subject.includes('paused')),
    ).toHaveLength(1);
  });

  test('an address with no account is paused the same way, and nobody is emailed', async ({
    page,
  }) => {
    const email = uniqueEmail('nobody');
    const signIn = new SignInPage(page);
    await failSignIns(page.request, email, 5);
    await signIn.open();

    await signIn.signIn(email, 'not-the-right-password');

    await expect(signIn.alertTitle()).toHaveText('Sign-in is paused for 15 minutes');
    expect(await emailsTo(email)).toHaveLength(0);
  });
});

// L2-023.3–.4, L2-072.1, L2-077.4 and L2-108 (sign-in-and-recover-access).
test.describe('Resetting a forgotten password', () => {
  test('“Forgot your password?” on the sign-in card leads to the reset page', async ({ page }) => {
    const signIn = new SignInPage(page);
    const forgot = new ForgotPasswordPage(page);
    await signIn.open();

    await signIn.forgotPasswordLink().click();

    await expect(forgot.heading()).toHaveText('Forgot your password?');
    expect(forgot.path()).toBe('/forgot-password');
  });

  test('asking for a link always ends on “Check your email”, and an account gets the link', async ({
    page,
  }) => {
    const booker = createBooker(uniqueEmail('reset'));
    const forgot = new ForgotPasswordPage(page);
    await forgot.open();

    await forgot.askFor(booker.email);

    await expect(forgot.heading()).toHaveText('Check your email');
    await expect(forgot.checkEmailLead()).toHaveText(
      'If that email has an account, we’ve sent a reset link.',
    );
    await expect(forgot.backToSignInLink()).toHaveAttribute('href', '/sign-in');
    const email = await waitForEmail(booker.email, 'Reset your Zamaro password');
    expect(email.from).toBe('hello@zamaro.ca');
    expect(linkIn(email, '/reset-password/')).toMatch(
      /^http:\/\/localhost:4000\/reset-password\/\w+$/,
    );
  });

  test('an address with no account sees the same, and nothing is sent', async ({ page }) => {
    const email = uniqueEmail('nobody');
    const forgot = new ForgotPasswordPage(page);
    await forgot.open();

    await forgot.askFor(email);

    await expect(forgot.checkEmailLead()).toHaveText(
      'If that email has an account, we’ve sent a reset link.',
    );
    expect(await emailsTo(email)).toHaveLength(0);
  });

  test('an email that is not an address is named before anything is sent', async ({ page }) => {
    const forgot = new ForgotPasswordPage(page);
    await forgot.open();

    await forgot.askFor('naomi.fraser@riversidecc');

    await expect(forgot.errorSummaryTitle()).toHaveText('Fix 1 thing to continue');
    await expect(forgot.emailError()).toHaveText('Enter an email address like name@church.ca');
    await expect(forgot.email()).toHaveAttribute('aria-invalid', 'true');
  });

  test('a failed bot check says so and keeps the email', async ({ page }) => {
    const forgot = new ForgotPasswordPage(page);
    await forgot.open();
    await forgot.failBotCheck();

    await forgot.askFor('naomi.fraser@riversidecc.ca');

    await expect(forgot.alertTitle()).toHaveText('We couldn’t check that you’re a person');
    await expect(forgot.email()).toHaveValue('naomi.fraser@riversidecc.ca');
  });

  test('a new password signs this browser in, ends the other sessions and is confirmed by email', async ({
    page,
    browser,
  }) => {
    const booker = createBooker(uniqueEmail('reset'));
    const elsewhere = await browser.newContext();
    await signInWith(elsewhere.request, booker.email);
    const otherSession = (await elsewhere.cookies()).find((c) => c.name === 'zamaro_session')!;
    expect(await meStatusWith(otherSession)).toBe(200);
    const forgot = new ForgotPasswordPage(page);
    const reset = new ResetPasswordPage(page);
    await forgot.open();
    await forgot.askFor(booker.email);
    const link = linkIn(
      await waitForEmail(booker.email, 'Reset your Zamaro password'),
      '/reset-password/',
    );

    await reset.openLink(link);
    await expect(reset.heading()).toHaveText('Choose a new password');
    await expect(reset.lead()).toHaveText(
      `For ${booker.email}. Saving signs you out on every other device.`,
    );
    await expect(reset.password()).toHaveAccessibleDescription(
      '12 to 128 characters, and not one found in a known data breach.',
    );
    await reset.choose('a-song-of-ascents-121', 'a-song-of-ascents-12l');
    await expect(reset.errorSummaryTitle()).toHaveText('Fix 1 thing to continue');
    await expect(reset.errorSummaryLinks()).toHaveText(['Make the two passwords match']);
    await expect(reset.confirmationError()).toHaveText(
      'The two passwords don’t match. Type the new one again.',
    );
    await reset.choose('a-song-of-ascents-121');

    await expect(reset.heading()).toHaveText('Password changed');
    await expect(reset.changedLead()).toHaveText(
      'You’re signed in on this device. Every other session on your account was signed out.',
    );
    await expect(reset.changedFinePrint()).toHaveText(
      `We also emailed ${booker.email} to say the password changed.`,
    );
    await expect(reset.shell.accountButton()).toBeVisible();
    expect(await meStatusWith(otherSession)).toBe(401);
    await waitForEmail(booker.email, 'Your Zamaro password was changed');
    await elsewhere.close();
  });

  test('a short password is named at the field', async ({ page }) => {
    const booker = createBooker(uniqueEmail('reset'));
    const forgot = new ForgotPasswordPage(page);
    const reset = new ResetPasswordPage(page);
    await forgot.open();
    await forgot.askFor(booker.email);
    await reset.openLink(
      linkIn(await waitForEmail(booker.email, 'Reset your Zamaro password'), '/reset-password/'),
    );

    await reset.choose('grace2026');

    await expect(reset.passwordError()).toHaveText(
      'Use at least 12 characters. A short phrase like a song line works well.',
    );
    await expect(reset.password()).toHaveAttribute('aria-invalid', 'true');
  });

  test('while the link is checked the card says so', async ({ page }) => {
    const reset = new ResetPasswordPage(page);
    await reset.holdCheck();

    await reset.startLink('http://localhost:4000/reset-password/held-token');

    await expect(reset.checkingStatus()).toHaveText('Checking your reset link…');
    await expect(reset.checkingButton()).toHaveText('Checking link…');
    await expect(reset.checkingButton()).toHaveAttribute('aria-busy', 'true');
  });

  test('a used link has expired, names its account and sends a new one', async ({ page }) => {
    const booker = createBooker(uniqueEmail('reset'));
    const forgot = new ForgotPasswordPage(page);
    const reset = new ResetPasswordPage(page);
    await forgot.open();
    await forgot.askFor(booker.email);
    const link = linkIn(
      await waitForEmail(booker.email, 'Reset your Zamaro password'),
      '/reset-password/',
    );
    await reset.openLink(link);
    await reset.choose('a-song-of-ascents-121');
    await expect(reset.heading()).toHaveText('Password changed');

    await reset.openLink(link);

    await expect(reset.heading()).toHaveText('This link has expired');
    await expect(reset.expiredText()).toHaveText(
      'Reset links work once, for 60 minutes. This one was sent at 10:00 a.m. and has run out.',
    );
    await expect(reset.expiredFinePrint()).toHaveText(`The new link goes to ${booker.email}.`);
    await reset.sendNewLink();
    await expect(reset.sendNewLinkButton()).toHaveText('Sent');
    await expect(reset.sendNewLinkButton()).toBeDisabled();
    await expect
      .poll(
        async () =>
          (await emailsTo(booker.email)).filter((e) => e.subject === 'Reset your Zamaro password')
            .length,
        {
          timeout: 15_000,
        },
      )
      .toBe(2);
  });
});
