import { expect, test } from '@playwright/test';
import { CAST_PASSWORD, createBooker, signIn, turnOnTwoFactor } from '../../fixtures/accounts';
import { waitForEmail } from '../../fixtures/mailbox';
import { totp } from '../../fixtures/totp';
import { AccountPage } from '../../pages/account.page';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { MfaChallengePage } from '../../pages/mfa-challenge.page';
import { MfaSetupPage } from '../../pages/mfa-setup.page';
import { SignInPage } from '../../pages/sign-in.page';

// L2-072.3 (sign-in-and-recover-access): turning on two-step sign-in, with recovery codes.
test.describe('Turning on two-step sign-in', () => {
  test('a booker turns it on from account settings and saves 10 recovery codes', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const setup = new MfaSetupPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();
    await expect(account.twoStepStatus()).toHaveText('Off');
    await expect(account.sectionLead('Two-step sign-in')).toContainText(
      'Turn it on and Zamaro asks for a 6-digit code from an authenticator app after your password.',
    );

    await account.turnOnTwoStepLink().click();

    await expect(setup.heading()).toHaveText('Turn on two-step sign-in');
    await expect(setup.key()).toHaveText(/^([A-Z2-7]{4} )+[A-Z2-7]{1,4}$/);
    await expect(setup.qrCode()).toHaveAccessibleName(
      `QR code that adds Zamaro, ${booker.email}, to an authenticator app`,
    );
    await expect(setup.code()).toBeFocused();
    await expect(setup.cancelLink()).toHaveAttribute('href', '/account#two-step');

    await setup.turnOn(totp(await setup.key().innerText()));

    await expect(setup.heading()).toHaveText('Save your recovery codes');
    await expect(setup.recoveryCodes()).toHaveCount(10);
    await expect(setup.recoveryCodes().first()).toHaveText(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
    await expect(setup.copyButton()).toBeVisible();
    await expect(setup.downloadButton()).toBeVisible();
    await expect(setup.finePrint()).toHaveText(
      `From now on Zamaro asks for a code after your password. We emailed ${booker.email} to say two-step sign-in is on.`,
    );
    await waitForEmail(booker.email, 'Two-step sign-in is on for your Zamaro account');

    await setup.savedThemLink().click();

    await expect(account.twoStepStatus()).toHaveText('On');
    await expect(account.sectionLead('Two-step sign-in')).toContainText(
      'Zamaro asks for a 6-digit code from your authenticator app after your password.',
    );
  });

  test('a wrong code is named and nothing changes', async ({ page }) => {
    const setup = new MfaSetupPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await setup.open();

    await setup.turnOn('000000');

    await expect(setup.errorSummaryTitle()).toHaveText('Check the code');
    await expect(setup.errorSummaryLinks()).toHaveText([
      'That code didn’t match. Enter the one showing now.',
    ]);
    await expect(setup.codeError()).toHaveText(
      'That code didn’t match. Codes change every 30 seconds; enter the one showing now.',
    );
    await expect(setup.code()).toHaveAttribute('aria-invalid', 'true');
    await expect(setup.code()).toHaveValue('000000');
  });

  test('while the code is checked the button says so; a failure says nothing changed', async ({
    page,
  }) => {
    const setup = new MfaSetupPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await setup.open();
    await setup.failConfirm();

    await setup.turnOn('123456');

    await expect(setup.alertTitle()).toHaveText('We couldn’t turn on two-step sign-in');
    await expect(page.getByRole('alert')).toContainText(
      'Nothing changed; you still sign in with your password only. Try again with the next code.',
    );
    await page.unrouteAll();
    await setup.holdConfirm();
    await setup.code().fill('654321');
    await setup.turnOnButton().click();
    await expect(setup.turnOnButton()).toHaveText('Checking…');
    await expect(setup.turnOnButton()).toHaveAttribute('aria-busy', 'true');
    await expect(setup.code()).toHaveAttribute('readonly', '');
  });
});

// L2-072.3–.4: signing in with a code, or a recovery code once.
test.describe('Signing in with two-step sign-in on', () => {
  test('the right password asks for the code, which returns the booker to their page', async ({
    page,
    browser,
  }) => {
    const booker = createBooker();
    const phone = await browser.newContext();
    await signIn(phone.request, booker.email);
    const { secret } = await turnOnTwoFactor(phone.request);
    await phone.close();
    const signInPage = new SignInPage(page);
    const challenge = new MfaChallengePage(page);
    const profile = new ArtistProfilePage(page);

    await signInPage.open('/artists/abigail-mensah?date=2026-11-14');
    await signInPage.signIn(booker.email, CAST_PASSWORD);

    await challenge.waitForIt();
    expect(challenge.path()).toBe('/account/sign-in/verify');
    await expect(challenge.field()).toBeFocused();
    await expect(challenge.fieldHelp()).toHaveText(`Signing in as ${booker.email}.`);
    await challenge.verify(totp(secret));

    await expect(profile.name()).toHaveText('Abigail Mensah');
    await expect(challenge.shell.accountButton()).toBeVisible();
  });

  test('a wrong code is named and counts against the account', async ({ page, browser }) => {
    const booker = createBooker();
    const phone = await browser.newContext();
    await signIn(phone.request, booker.email);
    await turnOnTwoFactor(phone.request);
    await phone.close();
    const signInPage = new SignInPage(page);
    const challenge = new MfaChallengePage(page);
    await signInPage.open();
    await signInPage.signIn(booker.email, CAST_PASSWORD);
    await challenge.waitForIt();

    await challenge.verify('000000');

    await expect(challenge.errorSummaryTitle()).toHaveText('That code didn’t work');
    await expect(challenge.errorSummaryLinks()).toHaveText(['Enter the code your app shows now']);
    await expect(challenge.fieldError()).toHaveText(
      'That code is wrong or has expired. Enter the code your app shows now.',
    );
    await expect(challenge.field()).toHaveAttribute('aria-invalid', 'true');
  });

  test('a recovery code signs in once', async ({ page, browser }) => {
    const booker = createBooker();
    const phone = await browser.newContext();
    await signIn(phone.request, booker.email);
    const { recoveryCodes } = await turnOnTwoFactor(phone.request);
    await phone.close();
    const signInPage = new SignInPage(page);
    const challenge = new MfaChallengePage(page);
    await signInPage.open();
    await signInPage.signIn(booker.email, CAST_PASSWORD);
    await challenge.waitForIt();

    await challenge.useRecoveryCode();
    await expect(challenge.lead()).toHaveText(
      'Lost your phone? Enter one of the 10 recovery codes you saved when you set up two-step sign-in. Each code works once.',
    );
    await expect(challenge.fieldHelp()).toHaveText(
      'Eight letters and numbers, with or without the dash, like 7kq4-m2xd.',
    );
    await challenge.verify(recoveryCodes[0]!);

    await expect(challenge.shell.accountButton()).toBeVisible();
  });
});
