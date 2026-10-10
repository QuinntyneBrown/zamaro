import { expect, test } from '@playwright/test';
import { accounts, CAST_PASSWORD, uniqueEmail } from '../../fixtures/accounts';
import { linkIn, waitForEmail } from '../../fixtures/mailbox';
import { SignInPage } from '../../pages/sign-in.page';
import { SignUpPage } from '../../pages/sign-up.page';

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
    await waitForEmail(accounts.naomi.email, 'Someone tried to sign up with your email');
  });

  test('a short password and unticked terms are named in the summary and at each field', async () => {
    const sent = signUp.registrationRequests();
    const email = uniqueEmail('naomi');

    await signUp.register({
      name: 'Naomi Fraser',
      email,
      password: 'grace2026',
      acceptTerms: false,
    });

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
