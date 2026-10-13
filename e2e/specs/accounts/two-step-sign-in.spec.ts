import { expect, test } from '@playwright/test';
import { CAST_PASSWORD, createBooker, signIn, turnOnTwoFactor } from '../../fixtures/accounts';
import { waitForEmail } from '../../fixtures/mailbox';
import { totp } from '../../fixtures/totp';
import { AccountPage } from '../../pages/account.page';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { MfaChallengePage } from '../../pages/mfa-challenge.page';
import { MfaSetupPage } from '../../pages/mfa-setup.page';
import { SignInPage } from '../../pages/sign-in.page';
import { TwoStepCodeDialog } from '../../pages/two-step-code.dialog';

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

// L2-072.5 and M2 D21: turning it off and new recovery codes need a code first.
test.describe('Managing two-step sign-in', () => {
  async function bookerWithTwoStep(
    page: import('@playwright/test').Page,
  ): Promise<{ email: string; secret: string; recoveryCodes: string[] }> {
    const booker = createBooker();
    await signIn(page.request, booker.email);
    const { secret, recoveryCodes } = await turnOnTwoFactor(page.request);
    return { email: booker.email, secret, recoveryCodes };
  }

  test('Turn off asks for a code, with Keep it on first, and a right one turns it off', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const dialog = new TwoStepCodeDialog(page);
    const booker = await bookerWithTwoStep(page);
    await account.open();
    await expect(account.twoStepStatus()).toHaveText('On');

    await account.turnOffTwoStepButton().click();

    await expect(dialog.heading()).toHaveText('Turn off two-step sign-in?');
    await expect(dialog.dialog()).toHaveAccessibleDescription('Enter a code to show it’s you.');
    await expect(dialog.consequences()).toHaveText([
      'You sign in with your password only.',
      'Your recovery codes stop working.',
      `We email ${booker.email} to say it’s off.`,
    ]);
    await expect(dialog.footerButtons()).toHaveText(['Keep it on', 'Turn off']);
    await expect(dialog.code()).toBeFocused();

    await dialog.submit('000000');
    await expect(dialog.errorSummaryTitle()).toHaveText('Check the code');
    await expect(dialog.errorSummaryLinks()).toHaveText(['That code didn’t work']);
    await expect(dialog.codeError()).toHaveText(
      'That code is wrong or has expired. Enter the code your app shows now, or an unused recovery code.',
    );

    await dialog.submit(totp(booker.secret));

    await expect(dialog.dialog()).toHaveCount(0);
    await expect(account.twoStepStatus()).toHaveText('Off');
    await waitForEmail(booker.email, 'Two-step sign-in is off for your Zamaro account');
  });

  test('Escape closes the dialog and focus returns to the button that opened it', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const dialog = new TwoStepCodeDialog(page);
    await bookerWithTwoStep(page);
    await account.open();
    await account.turnOffTwoStepButton().click();
    await expect(dialog.heading()).toBeVisible();

    await dialog.pressEscape();

    await expect(dialog.dialog()).toHaveCount(0);
    await expect(account.turnOffTwoStepButton()).toBeFocused();
    await expect(account.twoStepStatus()).toHaveText('On');
  });

  test('new recovery codes replace the old ones and are shown once', async ({ page }) => {
    const account = new AccountPage(page);
    const dialog = new TwoStepCodeDialog(page);
    const booker = await bookerWithTwoStep(page);
    await account.open();

    await account.newRecoveryCodesButton().click();
    await expect(dialog.heading()).toHaveText('Get new recovery codes?');
    await expect(dialog.footerButtons()).toHaveText(['Cancel', 'Get new codes']);
    await dialog.submit(booker.recoveryCodes[0]!);

    await expect(dialog.heading()).toHaveText('Save your new recovery codes');
    await expect(dialog.newCodes()).toHaveCount(10);
    const codes = await dialog.newCodes().allInnerTexts();
    expect(codes.some((code) => booker.recoveryCodes.includes(code))).toBe(false);
    await waitForEmail(booker.email, 'New recovery codes for your Zamaro account');

    await dialog.savedThemButton().click();
    await expect(dialog.dialog()).toHaveCount(0);
    await expect(account.newRecoveryCodesButton()).toBeFocused();
  });

  test('while turning off, the dialog is busy; a failure says nothing changed', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const dialog = new TwoStepCodeDialog(page);
    const booker = await bookerWithTwoStep(page);
    await account.open();
    await account.turnOffTwoStepButton().click();
    await dialog.failRequests();

    await dialog.submit(totp(booker.secret));

    await expect(dialog.alertTitle()).toHaveText('We couldn’t turn off two-step sign-in');
    await expect(dialog.dialog().getByRole('alert')).toContainText(
      'Nothing changed; it’s still on. Check your connection, then enter the code your app shows now.',
    );
    await expect(dialog.actionButton()).toHaveText('Try again');
    await expect(dialog.wayBackButton()).toBeFocused();

    await page.unrouteAll();
    await dialog.holdRequests();
    await dialog.actionButton().click();
    await expect(dialog.actionButton()).toHaveText('Turning off…');
    await expect(dialog.actionButton()).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.wayBackButton()).toBeDisabled();
    await expect(dialog.code()).toHaveAttribute('readonly', '');
  });
});
