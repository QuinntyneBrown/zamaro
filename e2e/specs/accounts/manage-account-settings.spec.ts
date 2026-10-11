import { expect, test } from '@playwright/test';
import {
  accounts,
  CAST_PASSWORD,
  createBooker,
  meStatusIn,
  signIn,
  signInAs,
  uniqueEmail,
} from '../../fixtures/accounts';
import { emailsTo, linkIn, waitForEmail } from '../../fixtures/mailbox';
import { AccountPage, RIVERSIDE } from '../../pages/account.page';
import { ConfirmEmailPage } from '../../pages/confirm-email.page';

// L2-025, L2-024.2, L2-105 and L2-108 (accounts/manage-account-settings).
test.describe('Account settings', () => {
  test('Naomi’s page names her and her church, with the settings nav', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');

    await account.open();

    await expect(account.heading()).toHaveText('Account settings');
    await expect(account.subtitle()).toHaveText('Naomi Fraser · Riverside Community Church');
    await expect(account.settingsNavLinks()).toHaveText([
      'Profile',
      'Church',
      'Email',
      'Password',
      'Two-step sign-in',
      'Signed-in devices',
    ]);
    await expect(account.settingsNavLinks().first()).toHaveAttribute('aria-current', 'true');
    await expect(account.yourName()).toHaveValue('Naomi Fraser');
    expect(await account.descriptionOf(account.yourName())).toBe(
      'Artists see it on your requests.',
    );
    await expect(account.saveButton()).toHaveText('Save changes');
    await expect(account.discardButton()).toBeEnabled();
  });

  test('a guest is sent to sign in and comes back', async ({ page }) => {
    const account = new AccountPage(page);

    await account.openOnly();

    await expect(page).toHaveURL(/\/sign-in\?returnUrl=%2Faccount$/);
  });

  test('a new name is saved and the header’s initials follow it', async ({ page }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();

    await account.yourName().fill('Ruth Okafor');
    await account.save();

    await expect(account.status()).toHaveText('Saved just now');
    await expect(account.shell.accountButton()).toHaveText('RO');
    await expect(account.shell.accountButton()).toHaveAccessibleName(
      'Account menu for Ruth Okafor',
    );
    await expect(account.subtitle()).toHaveText('Ruth Okafor');
  });

  test('Discard puts back what was saved', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');
    await account.open();

    await account.yourName().fill('Someone Else');
    await account.fillChurch({ city: 'Hamilton' });
    await account.discard();

    await expect(account.yourName()).toHaveValue('Naomi Fraser');
    await expect(account.city()).toHaveValue('Burlington');
  });

  test('while saving, the bar says so and the fields are read-only', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');
    await account.open();
    await account.holdSaves();

    await account.fillChurch({ typicalAttendance: '400' });
    await account.saveButton().click();

    await expect(account.status()).toHaveText('Saving…');
    await expect(account.saveButton()).toHaveText('Saving…');
    await expect(account.saveButton()).toHaveAttribute('aria-busy', 'true');
    await expect(account.discardButton()).toBeDisabled();
    await expect(account.attendance()).toHaveAttribute('readonly', '');
    await expect(account.form()).toHaveAttribute('aria-busy', 'true');
  });

  test('a failed save says nothing was saved and keeps every change', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');
    await account.open();
    await account.failSaves();

    await account.fillChurch({ typicalAttendance: '400' });
    await account.save();

    await expect(account.alertTitle()).toHaveText('We couldn’t save your changes');
    await expect(account.alert()).toContainText(
      'Nothing was saved. Everything you changed is still here; press Save changes to try again.',
    );
    await expect(account.status()).toHaveText('Not saved · try again');
    await expect(account.attendance()).toHaveValue('400');
  });

  test('when the settings cannot load, the page says so and Try again loads them', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');
    await account.failLoading();

    await account.openOnly();

    await expect(account.alertTitle()).toHaveText('We couldn’t load your settings');
    await expect(account.alert()).toContainText(
      'Nothing has changed on your account. Check your connection and try again.',
    );
    await expect(account.backToDiscoverLink()).toHaveAttribute('href', '/');
    await page.unrouteAll();
    await account.tryAgainButton().click();
    await expect(account.churchName()).toHaveValue('Riverside Community Church');
  });
});

// L2-025.4: the artist's private contact phone, in place of the church.
test.describe('An artist’s account settings', () => {
  test('Abigail sees Contact in place of Church, with her private phone', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'abigail');

    await account.open();

    await expect(account.subtitle()).toHaveText('Abigail Mensah · Artist');
    await expect(account.settingsNavLinks()).toHaveText([
      'Profile',
      'Contact',
      'Email',
      'Password',
      'Two-step sign-in',
      'Signed-in devices',
    ]);
    await expect(account.section('Church')).toHaveCount(0);
    await expect(account.contactPhone()).toHaveValue('905-555-0148');
    expect(await account.descriptionOf(account.contactPhone())).toBe(
      'Churches see it only once a booking is confirmed. It’s never on your public profile.',
    );
    expect(await account.descriptionOf(account.yourName())).toBe(
      'Your account name. Churches see the display name from Edit profile.',
    );
  });

  test('her phone saves, and a number that is not North American is named', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'abigail');
    await account.open();

    await account.contactPhone().fill('905-555-01');
    await account.saveButton().click();
    await expect(account.errorFor(account.contactPhone())).toHaveText(
      'Enter a North American phone number, like 905-555-0123.',
    );

    await account.contactPhone().fill('905-555-0148');
    await account.save();
    await expect(account.status()).toHaveText('Saved just now');
  });
});

test.describe('A booker’s church on a fresh account', () => {
  test('a booker with no church sees an empty church section', async ({ page }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);

    await account.open();

    await expect(account.churchName()).toHaveValue('');
    await expect(account.subtitle()).not.toContainText(RIVERSIDE.name);
  });
});

// L2-025.1 (accounts/manage-account-settings): a new email takes over only once its link is opened.
test.describe('Changing the email', () => {
  /** Asks for `moved` from a fresh booker's settings and returns the link emailed to it. */
  async function askForNewEmail(account: AccountPage, moved: string): Promise<string> {
    await account.newEmail().fill(moved);
    await account.emailPassword().fill(CAST_PASSWORD);
    await account.save();
    return linkIn(
      await waitForEmail(moved, 'Confirm your new email for Zamaro'),
      '/account/email/confirm',
    );
  }

  test('the new address takes over only once its link is opened, and the old one is told', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const confirm = new ConfirmEmailPage(page);
    const booker = createBooker();
    const moved = uniqueEmail('moved');
    await signIn(page.request, booker.email);
    await account.open();
    await expect(account.sectionLead('Email')).toHaveText(
      `You sign in with ${booker.email}. A new address takes over only after you open the link we send to it, and we tell the old one.`,
    );

    const link = await askForNewEmail(account, moved);

    await expect(account.status()).toHaveText('Saved just now');
    await expect(account.emailPending()).toHaveText(
      `We sent a link to ${moved}. You sign in with ${booker.email} until you open it.`,
    );
    await expect(account.newEmail()).toHaveValue('');
    const notice = await waitForEmail(booker.email, 'Your Zamaro email is changing');
    expect(notice.text).toContain(moved);
    await account.reload();
    await expect(account.sectionLead('Email')).toContainText(`You sign in with ${booker.email}.`);
    await expect(account.emailPending()).toContainText(`We sent a link to ${moved}.`);

    await confirm.openLink(link);

    await expect(account.emailChangedBanner()).toContainText(`You now sign in with ${moved}.`);
    expect(confirm.path()).toBe('/account');
    await expect(account.sectionLead('Email')).toContainText(`You sign in with ${moved}.`);
  });

  test('while the link is confirmed the card names both addresses', async ({ page }) => {
    const account = new AccountPage(page);
    const confirm = new ConfirmEmailPage(page);
    const booker = createBooker();
    const moved = uniqueEmail('moved');
    await signIn(page.request, booker.email);
    await account.open();
    const link = await askForNewEmail(account, moved);
    await confirm.holdConfirm();

    await confirm.startLink(link);

    await expect(confirm.heading()).toHaveText('Confirming your new email');
    await expect(confirm.confirmingCard()).toHaveAttribute('aria-busy', 'true');
    await expect(confirm.confirmingStatus()).toHaveText(`Switching your sign-in to ${moved}…`);
    await expect(confirm.confirmingCard()).toContainText(
      `Until this finishes you still sign in with ${booker.email}.`,
    );
  });

  test('when Zamaro does not answer, Try again confirms the link', async ({ page }) => {
    const account = new AccountPage(page);
    const confirm = new ConfirmEmailPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();
    const link = await askForNewEmail(account, uniqueEmail('moved'));
    await confirm.failConfirm();

    await confirm.openLink(link);

    await expect(confirm.alertTitle()).toHaveText('We couldn’t confirm your new email');
    await expect(confirm.confirmingCard()).toContainText(
      'Zamaro didn’t answer. Nothing changed and your link still works; try again in a minute.',
    );
    await expect(confirm.backToAccountLink()).toHaveAttribute('href', '/account');
    await confirm.restoreConfirm();
    await confirm.tryAgain();
    await expect(account.emailChangedBanner()).toBeVisible();
  });

  test('a used link has expired and offers to change the email again', async ({ page }) => {
    const account = new AccountPage(page);
    const confirm = new ConfirmEmailPage(page);
    const booker = createBooker();
    const moved = uniqueEmail('moved');
    await signIn(page.request, booker.email);
    await account.open();
    const link = await askForNewEmail(account, moved);
    await confirm.openLink(link);
    await expect(account.emailChangedBanner()).toBeVisible();

    await confirm.openLink(link);

    await expect(confirm.heading()).toHaveText('This link has expired');
    await expect(confirm.stamp()).toHaveText('Expired');
    await expect(confirm.expiredText()).toHaveText(
      `Nothing changed: you still sign in with ${moved}. Ask for the change again to get a new link.`,
    );
    await expect(confirm.changeAgainLink()).toHaveAttribute('href', '/account#email');
  });

  test('an address another account uses looks the same, and no link is sent to it', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();

    await account.newEmail().fill(accounts.naomi.email);
    await account.emailPassword().fill(CAST_PASSWORD);
    await account.save();

    await expect(account.status()).toHaveText('Saved just now');
    await expect(account.emailPending()).toHaveText(
      `We sent a link to ${accounts.naomi.email}. You sign in with ${booker.email} until you open it.`,
    );
    await waitForEmail(booker.email, 'Your Zamaro email is changing');
    expect(
      (await emailsTo(accounts.naomi.email)).filter((email) =>
        email.subject.startsWith('Confirm your new email'),
      ),
    ).toHaveLength(0);
  });

  test('a wrong current password is named at the field', async ({ page }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();

    await account.newEmail().fill(uniqueEmail('moved'));
    await account.emailPassword().fill('not-my-password');
    await account.save();

    await expect(account.errorFor(account.emailPassword())).toHaveText(
      'That password isn’t right. Check it and try again.',
    );
    await expect(account.errorSummaryLinks()).toHaveText(['The password isn’t right']);
  });

  test('an incomplete new email is named before anything is sent', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');
    await account.open();
    const sent = account.saveRequests();

    await account.newEmail().fill('naomi@riversidecc');
    await account.emailPassword().fill(CAST_PASSWORD);
    await account.saveButton().click();

    await expect(account.errorSummaryLinks()).toHaveText(['Enter a full new email address']);
    await expect(account.errorFor(account.newEmail())).toHaveText(
      'Enter an email address like name@church.ca.',
    );
    expect(sent).toEqual([]);
  });
});

// L2-025.2: a new password signs out every other device.
test.describe('Changing the password', () => {
  test('a new password ends the other sessions and keeps this one', async ({ page, browser }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    const elsewhere = await browser.newContext();
    await signIn(elsewhere.request, booker.email);
    await signIn(page.request, booker.email);
    await account.open();
    await expect(account.sectionLead('Password')).toHaveText(
      'Leave these empty to keep your password. A new one signs you out on your other device.',
    );

    await account.currentPassword().fill(CAST_PASSWORD);
    await account.newPassword().fill('a-song-of-ascents-121');
    await account.save();

    await expect(account.status()).toHaveText('Saved just now');
    await expect(account.currentPassword()).toHaveValue('');
    await expect(account.newPassword()).toHaveValue('');
    await account.reload();
    await expect(account.yourName()).toBeVisible();
    expect(await meStatusIn(elsewhere)).toBe(401);
    await elsewhere.close();
  });

  test('a short new password and a wrong current one are named at their fields', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();

    await account.currentPassword().fill(CAST_PASSWORD);
    await account.newPassword().fill('grace2026');
    await account.saveButton().click();
    await expect(account.errorFor(account.newPassword())).toHaveText(
      'This one has 9 characters. Use at least 12.',
    );

    await account.currentPassword().fill('not-my-password');
    await account.newPassword().fill('a-song-of-ascents-121');
    await account.save();
    await expect(account.errorFor(account.currentPassword())).toHaveText(
      'That password isn’t right. Check it and try again.',
    );
  });
});

// L2-025.3 and L2-074.2: every signed-in session, and ending one at once.
test.describe('Signed-in devices', () => {
  const IPHONE =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

  test('the list starts with this device, then the others', async ({ page, browser }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    const phone = await browser.newContext({ userAgent: IPHONE });
    await signIn(phone.request, booker.email);
    await signIn(page.request, booker.email);

    await account.open();

    await expect(account.deviceNames()).toHaveText([/^Chrome on /, 'Safari on iPhone']);
    const first = account.deviceList().getByRole('listitem').first();
    await expect(first).toContainText('This device');
    await expect(first.locator('.text-muted')).toHaveText(
      'Burlington, ON · This device · active now',
    );
    await expect(account.deviceDetail('Safari on iPhone')).toHaveText(
      'Burlington, ON · Last active just now',
    );
    await expect(account.section('Signed-in devices')).toContainText(
      'Cities are approximate, from each device’s network. Ending a session signs that device out at once.',
    );
    await phone.close();
  });

  test('End session signs that device out at once, without asking', async ({ page, browser }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    const phone = await browser.newContext({ userAgent: IPHONE });
    await signIn(phone.request, booker.email);
    await signIn(page.request, booker.email);
    await account.open();

    await account.endSessionButton('Safari on iPhone').click();

    await expect(account.deviceRow('Safari on iPhone')).toHaveCount(0);
    expect(await meStatusIn(phone)).toBe(401);
    await expect(account.deviceNames()).toHaveCount(1);
    await phone.close();
  });
});
