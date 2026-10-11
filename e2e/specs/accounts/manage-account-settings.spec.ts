import { expect, test } from '@playwright/test';
import { createBooker, signIn, signInAs } from '../../fixtures/accounts';
import { AccountPage, RIVERSIDE } from '../../pages/account.page';

// L2-025, L2-024.2, L2-105 and L2-108 (accounts/manage-account-settings).
test.describe('Account settings', () => {
  test('Naomi’s page names her and her church, with the settings nav', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');

    await account.open();

    await expect(account.heading()).toHaveText('Account settings');
    await expect(account.subtitle()).toHaveText('Naomi Fraser · Riverside Community Church');
    await expect(account.settingsNavLinks()).toHaveText(['Profile', 'Church']);
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
    await expect(account.settingsNavLinks()).toHaveText(['Profile', 'Contact']);
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
