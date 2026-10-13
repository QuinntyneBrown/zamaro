import { expect, type Page, test } from '@playwright/test';
import {
  accounts,
  CAST_PASSWORD,
  createBooker,
  signIn as signInThrough,
  uniqueEmail,
} from '../../fixtures/accounts';
import { passTime, startClock } from '../../fixtures/clock';
import { linkIn, waitForEmail, waitForEmails } from '../../fixtures/mailbox';
import { DiscoverPage } from '../../pages/discover.page';
import { NotFoundPage } from '../../pages/not-found.page';
import { SignInPage } from '../../pages/sign-in.page';
import { SignUpPage } from '../../pages/sign-up.page';
import { VerifyEmailPage } from '../../pages/verify-email.page';

// L2-022.1–.2, L2-072.1, L2-077.4, L2-080.1–.2 and L2-108 (register-booker, record-consent).
test.describe('Registering as a booker', () => {
  let signUp: SignUpPage;

  test.beforeEach(async ({ page }) => {
    signUp = new SignUpPage(page);
    await signUp.open();
  });

  test('the form starts in Full name with two separate, unticked boxes', async () => {
    await expect(signUp.heading()).toHaveText('Create your account');
    await expect(signUp.name()).toBeFocused();
    await expect(signUp.terms()).not.toBeChecked();
    await expect(signUp.news()).not.toBeChecked();
    await expect(signUp.password()).toHaveAccessibleDescription(
      '12 to 128 characters. Passwords found in known data breaches are refused.',
    );
  });

  test('a guest registers and is asked to check their email, which holds the link', async () => {
    const email = uniqueEmail('ruth');

    await signUp.register({
      name: 'Ruth Adeyemi',
      email,
      password: CAST_PASSWORD,
      acceptTerms: true,
    });

    await expect(signUp.checkEmailHeading()).toHaveText('Check your email to finish signing up');
    await expect(signUp.checkEmailHeading()).toBeFocused();
    await expect(signUp.checkEmailLead()).toHaveText(
      `We sent a link to ${email}. It works for 24 hours.`,
    );
    await expect(signUp.keepBrowsingLink()).toHaveAttribute('href', '/');
    const verification = await waitForEmail(email, 'Verify your email for Zamaro');
    expect(verification.from).toBe('hello@zamaro.ca');
    expect(verification.html).toContain('Ruth');
    expect(verification.text).toContain('Hi Ruth,');
    expect(linkIn(verification, '/verify-email')).toMatch(
      /^http:\/\/localhost:4000\/verify-email\?token=\w+&returnUrl=%2F$/,
    );
  });

  test('“Resend the email” sends a new link, then rests for a minute', async () => {
    const email = uniqueEmail('ruth');
    await signUp.register({
      name: 'Ruth Adeyemi',
      email,
      password: CAST_PASSWORD,
      acceptTerms: true,
    });
    await waitForEmail(email, 'Verify your email for Zamaro');
    await expect(signUp.checkEmailFinePrint()).toHaveText(
      'Nothing after 5 minutes? Check spam or junk, then resend.',
    );

    await signUp.resend();

    await expect(signUp.resendButton()).toHaveText('Sent');
    await expect(signUp.resendButton()).toBeDisabled();
    await expect(signUp.resentStatus()).toHaveText(
      `A new link is on its way to ${email}. It works for 24 hours.`,
    );
    await waitForEmails(email, 2);
  });

  test('while the account is being created the card is busy and sends once', async () => {
    const sent = signUp.registrationRequests();
    await signUp.holdRegistration();
    await signUp.fill({
      name: 'Ruth Adeyemi',
      email: uniqueEmail('ruth'),
      password: CAST_PASSWORD,
      acceptTerms: true,
    });

    await signUp.submit();

    await expect(signUp.submitButton()).toHaveText('Creating account…');
    await expect(signUp.submitButton()).toHaveAttribute('aria-busy', 'true');
    await expect(signUp.submitButton()).toHaveAttribute('aria-disabled', 'true');
    await expect(signUp.name()).toHaveAttribute('readonly');
    await expect(signUp.password()).toHaveAttribute('readonly');
    await expect(signUp.terms()).toBeDisabled();
    await expect(signUp.terms()).toBeChecked();
    await expect(signUp.news()).toBeDisabled();
    await expect.poll(() => sent.length).toBe(1);
    await signUp.submitButton().click({ force: true });
    expect(sent).toHaveLength(1);
  });

  test('registering an address that has an account looks the same, and its owner is told', async () => {
    await signUp.register({
      name: 'Naomi Fraser',
      email: accounts.naomi.email,
      password: 'a-brand-new-password',
      acceptTerms: true,
    });

    await expect(signUp.checkEmailHeading()).toHaveText('Check your email to finish signing up');
    await expect(signUp.checkEmailLead()).toHaveText(
      `We sent a link to ${accounts.naomi.email}. It works for 24 hours.`,
    );
    const notice = await waitForEmail(
      accounts.naomi.email,
      'Someone tried to sign up with your email',
    );
    expect(linkIn(notice, '/forgot-password')).toBe('http://localhost:4000/forgot-password');
  });

  test('a short password and unticked terms are named in the summary and at each field', async () => {
    const sent = signUp.registrationRequests();
    const email = uniqueEmail('naomi');

    await signUp.fill({
      name: 'Naomi Fraser',
      email,
      password: 'grace2026',
      acceptTerms: false,
    });
    await signUp.submit();

    await expect(signUp.errorSummaryTitle()).toHaveText('Fix 2 things to continue');
    await expect(signUp.errorSummaryLinks()).toHaveText([
      'Use at least 12 characters for your password',
      'Accept the terms and privacy policy',
    ]);
    await expect(signUp.errorSummary()).toBeFocused();
    await expect(signUp.passwordError()).toHaveText('This one has 9 characters. Use at least 12.');
    await expect(signUp.termsError()).toHaveText(
      'Accept the terms and privacy policy to create an account.',
    );
    await expect(signUp.password()).toHaveAttribute('aria-invalid', 'true');
    await expect(signUp.terms()).toHaveAttribute('aria-invalid', 'true');
    await expect(signUp.terms()).toHaveAccessibleDescription(
      'Accept the terms and privacy policy to create an account.',
    );
    await expect(signUp.name()).toHaveValue('Naomi Fraser');
    await expect(signUp.email()).toHaveValue(email);
    await expect(signUp.password()).toHaveValue('grace2026');
    expect(sent).toHaveLength(0);

    await signUp.errorSummaryLinks().nth(1).click();
    await expect(signUp.terms()).toBeFocused();
  });

  test('a failed bot check keeps every value and says so', async () => {
    const email = uniqueEmail('ruth');
    await signUp.failBotCheck();

    await signUp.register({
      name: 'Ruth Adeyemi',
      email,
      password: CAST_PASSWORD,
      acceptTerms: true,
      news: true,
    });

    await expect(signUp.alertTitle()).toHaveText('We couldn’t check that you’re a person');
    await expect(signUp.alertText()).toHaveText(
      'Everything you typed is still here. Press Create account to try again; if it keeps happening, email hello@zamaro.ca.',
    );
    await expect(signUp.name()).toHaveValue('Ruth Adeyemi');
    await expect(signUp.email()).toHaveValue(email);
    await expect(signUp.password()).toHaveValue(CAST_PASSWORD);
    await expect(signUp.terms()).toBeChecked();
    await expect(signUp.news()).toBeChecked();
  });

  test('when Zamaro does not answer, everything typed is kept', async () => {
    await signUp.failRegistration();

    await signUp.register({
      name: 'Ruth Adeyemi',
      email: uniqueEmail('ruth'),
      password: CAST_PASSWORD,
      acceptTerms: true,
    });

    await expect(signUp.alertTitle()).toHaveText('We couldn’t create your account');
    await expect(signUp.password()).toHaveValue(CAST_PASSWORD);
    await expect(signUp.terms()).toBeChecked();
  });

  test('“Already have an account? Sign in” leads to sign-in, whose links lead back', async ({
    page,
  }) => {
    const signIn = new SignInPage(page);

    await signUp.signInLink().click();

    await expect(signIn.heading()).toHaveText('Sign in');
    await expect(signIn.shell.createAccountLink()).toHaveAccessibleName('Create account');
    await signIn.createAccountLink().click();
    await expect(signUp.heading()).toHaveText('Create your account');
    expect(signUp.path()).toBe('/sign-up');
  });

  test('the footer offers both ways in to a guest', async () => {
    await expect(signUp.shell.footerColumn('Your account')).toHaveText([
      'Sign in',
      'Create an account',
    ]);
  });
});

/** Registers a new booker through the page and returns the link from their verification email. */
async function registerAndReadLink(page: Page, email: string): Promise<string> {
  const signUp = new SignUpPage(page);
  await signUp.open();
  await signUp.register({
    name: 'Ruth Adeyemi',
    email,
    password: CAST_PASSWORD,
    acceptTerms: true,
  });
  return linkIn(await waitForEmail(email, 'Verify your email for Zamaro'), '/verify-email');
}

// L2-022.3 (register-booker): the link, once and for 24 hours; a new one on request.
test.describe('Verifying the email address', () => {
  test('the link is checked, then Discover thanks the person for one page', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    const link = await registerAndReadLink(page, uniqueEmail('ruth'));

    await verify.openLink(link);

    const thanks = verify.shell.banner('Email verified');
    await expect(thanks.text()).toContainText('Thanks, Ruth. You can send booking requests now.');
    expect(verify.path()).toBe('/');
    await expect(thanks.closeButton()).toHaveAccessibleName('Dismiss verified notice');
    await verify.shell.signInFromHeader();
    await expect(new SignInPage(page).heading()).toHaveText('Sign in');
    await expect(verify.shell.banners()).toHaveCount(0);
  });

  test('while the link is checked the card says so', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    await verify.holdCheck();

    await verify.startToken('held-token');

    await expect(verify.heading()).toHaveText('Checking your link');
    await expect(verify.checkingCard()).toHaveAttribute('aria-busy', 'true');
    await expect(verify.checkingStatus()).toHaveText('Confirming your email…');
  });

  test('a used link has expired, and “Send a new link” sends one', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    const email = uniqueEmail('ruth');
    const link = await registerAndReadLink(page, email);
    await verify.openLink(link);
    await expect(verify.shell.banner('Email verified').root).toBeVisible();

    await verify.openLink(link);

    await expect(verify.heading()).toHaveText('This link has expired');
    await expect(verify.stamp()).toHaveText('Expired');
    await expect(verify.keepBrowsingLink()).toHaveAttribute('href', '/');
    await expect(verify.finePrint()).toHaveText(
      'The new link goes to the email you signed up with. Nothing after 5 minutes? Check spam or junk.',
    );
    await verify.sendNewLink();
    await expect(verify.sendNewLinkButton()).toHaveText('Sent');
    await expect(verify.sendNewLinkButton()).toBeDisabled();
    await expect(verify.sentStatus()).toHaveText(
      'A new link is on its way to the email you signed up with. It works for 24 hours.',
    );
  });

  test('a revoked link’s new link goes to its owner and works', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    const signUp = new SignUpPage(page);
    const email = uniqueEmail('ruth');
    const first = await registerAndReadLink(page, email);
    await signUp.resend();
    await waitForEmails(email, 2);

    // The resend revoked the first link.
    await verify.openLink(first);
    await expect(verify.heading()).toHaveText('This link has expired');
    await verify.sendNewLink();

    const [newest] = await waitForEmails(email, 3);
    await verify.openLink(linkIn(newest, '/verify-email'));
    await expect(verify.shell.banner('Email verified').root).toBeVisible();
  });

  test('when Zamaro does not answer, the link still works on Try again', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    const link = await registerAndReadLink(page, uniqueEmail('ruth'));
    await verify.failCheck();

    await verify.openLink(link);

    await expect(verify.alertTitle()).toHaveText('We couldn’t check your link');
    await expect(verify.alertText()).toHaveText(
      'Zamaro didn’t answer. Your link still works; try again in a minute.',
    );
    await verify.restoreCheck();
    await verify.tryAgain();
    await expect(verify.shell.banner('Email verified').root).toBeVisible();
  });

  test('until the address is verified, every page asks for it, and Resend email sends a new link', async ({
    page,
  }) => {
    const { email } = createBooker(uniqueEmail('ruth'), { verified: false });
    await signInThrough(page.request, email);
    const discover = new DiscoverPage(page);
    await startClock(page);
    await discover.openAndHydrate();

    const banner = discover.shell.banner('Verify your email');
    await expect(banner.text()).toContainText(
      `We sent a link to ${email}. You need it to send requests.`,
    );
    await expect(banner.action()).toHaveText('Resend email');
    await expect(banner.root).toHaveClass(/banner--persistent/);
    await expect(banner.closeButton()).toHaveCount(0);

    await banner.pressAction();

    await expect(banner.text()).toContainText(
      `A new link is on its way to ${email}. It works for 24 hours.`,
    );
    await expect(banner.action()).toHaveText('Sent');
    await expect(banner.action()).toBeDisabled();
    await waitForEmail(email, 'Verify your email for Zamaro');
    await passTime(page, 60_000);
    await expect(banner.action()).toHaveText('Resend email');
    await expect(banner.action()).toBeEnabled();

    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-page');
    await expect(notFound.shell.banner('Verify your email').root).toBeVisible();
  });

  test('a verified booker sees no banner', async ({ page }) => {
    const { email } = createBooker(uniqueEmail('naomi'));
    await signInThrough(page.request, email);
    const discover = new DiscoverPage(page);
    await discover.freezeClock();

    await discover.openAndHydrate();

    await expect(discover.shell.accountButton()).toBeVisible();
    await expect(discover.shell.banners()).toHaveCount(0);
  });
});
