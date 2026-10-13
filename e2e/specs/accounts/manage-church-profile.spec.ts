import { expect, test } from '@playwright/test';
import { createBooker, signIn, signInAs } from '../../fixtures/accounts';
import { AccountPage, RIVERSIDE } from '../../pages/account.page';
import { DiscoverPage } from '../../pages/discover.page';
import { SearchForm } from '../../pages/search-form';

// L2-024 and L2-001 (accounts/manage-church-profile), L2-108 (account settings' form).
test.describe('The church on account settings', () => {
  test('Naomi’s church is filled in, under the lead about bookings already sent', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');

    await account.open();

    await expect(account.sectionLead('Church')).toHaveText(
      'Artists see this on every request. Bookings already sent keep the address they were made with.',
    );
    await expect(account.churchName()).toHaveValue('Riverside Community Church');
    await expect(account.streetAddress()).toHaveValue('2150 Lakeshore Road');
    await expect(account.city()).toHaveValue('Burlington');
    await expect(account.postalCode()).toHaveValue('L7R 1A3');
    await expect(account.churchPhone()).toHaveValue('905-555-0123');
    await expect(account.denomination()).toHaveValue('Non-denominational');
    await expect(account.attendance()).toHaveValue('350');
    expect(await account.descriptionOf(account.streetAddress())).toBe(
      'Must be inside the Zamaro service area.',
    );
  });

  test('saving Riverside shows “Saved”, and the menu, footer and Discover use it', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();
    await expect(account.churchName()).toHaveValue('');

    await account.fillChurch(RIVERSIDE);
    await account.save();

    await expect(account.status()).toHaveText('Saved just now');
    await expect(account.savedBanner()).toContainText(
      'Your settings are up to date. Bookings already sent keep the church address they were made with.',
    );
    await account.dismissSavedBanner().click();
    await expect(account.savedBanner()).toHaveCount(0);
    await account.reload();
    await expect(account.streetAddress()).toHaveValue('2150 Lakeshore Road');
    await expect(account.shell.accountFooterColumn()).toHaveText(['Riverside Community Church']);
    const menu = await account.shell.openAccountMenu();
    await expect(menu.who()).toContainText('Riverside Community Church');
    await menu.closeWithEscape();

    const discover = new DiscoverPage(page);
    const search = new SearchForm(page);
    await discover.openAndHydrate();
    await expect(search.locationField()).toHaveValue(/^Burlington/);
    expect(await search.selectedText(search.radiusField())).toMatch(/^120 km/);
  });

  test('an Ottawa address is refused, nothing is stored and every value stays', async ({
    page,
  }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();
    const ottawa = {
      ...RIVERSIDE,
      streetAddress: '180 Elgin Street',
      city: 'Ottawa',
      postalCode: 'K2P 2K3',
    };

    await account.fillChurch(ottawa);
    await account.save();

    await expect(account.errorSummaryTitle()).toHaveText('Your church wasn’t saved');
    await expect(account.errorSummaryLinks()).toHaveText([
      'Zamaro serves churches within 200 km of Toronto.',
    ]);
    await expect(account.errorSummary()).toBeFocused();
    await expect(account.errorFor(account.streetAddress())).toHaveText(
      'Zamaro serves churches within 200 km of Toronto.',
    );
    await expect(account.streetAddress()).toHaveAttribute('aria-invalid', 'true');
    await expect(account.city()).toHaveAttribute('aria-invalid', 'true');
    await expect(account.postalCode()).toHaveAttribute('aria-invalid', 'true');
    await expect(account.status()).toHaveText('Church address outside the area · not saved');
    await expect(account.streetAddress()).toHaveValue('180 Elgin Street');
    await expect(account.city()).toHaveValue('Ottawa');
    await expect(account.churchPhone()).toHaveValue('905-555-0123');

    await account.reload();
    await expect(account.streetAddress()).toHaveValue('');
  });

  test('an address that cannot be found says so at the street address', async ({ page }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();

    await account.fillChurch({ ...RIVERSIDE, streetAddress: '1 Nowhere Lane' });
    await account.save();

    await expect(account.errorSummaryTitle()).toHaveText('Your church wasn’t saved');
    await expect(account.errorFor(account.streetAddress())).toHaveText(
      'We couldn’t find that address. Check the street and postal code.',
    );
    await expect(account.status()).toHaveText('Church address not found · not saved');
    await expect(account.streetAddress()).toHaveValue('1 Nowhere Lane');
  });

  test('a short postal code is named before anything is sent', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');
    await account.open();
    const sent = account.saveRequests();

    await account.fillChurch({ postalCode: 'L7R 1A' });
    await account.saveButton().click();

    await expect(account.errorSummaryTitle()).toHaveText('Fix 1 thing before saving');
    await expect(account.errorSummaryLinks()).toHaveText(['Enter a full postal code']);
    await expect(account.errorFor(account.postalCode())).toHaveText(
      'Enter a postal code like L7R 1A3, with six characters.',
    );
    await expect(account.postalCode()).toHaveAttribute('aria-invalid', 'true');
    await expect(account.status()).toHaveText('1 field to fix · not saved');
    expect(sent).toEqual([]);

    await account.errorSummaryLinks().first().click();
    await expect(account.postalCode()).toBeFocused();
  });

  test('a phone that is not North American is named at the field', async ({ page }) => {
    const account = new AccountPage(page);
    await signInAs(page.context(), 'naomi');
    await account.open();

    await account.fillChurch({ phone: '555-0123' });
    await account.saveButton().click();

    await expect(account.errorFor(account.churchPhone())).toHaveText(
      'Enter a North American phone number, like 905-555-0123.',
    );
    await expect(account.errorSummaryLinks()).toHaveText(['Enter a full phone number']);
  });
});
