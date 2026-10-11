import { expect, test } from '@playwright/test';
import { createBooker, signIn } from '../../fixtures/accounts';
import { AcceptTermsPage } from '../../pages/accept-terms.page';
import { AccountPage } from '../../pages/account.page';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { SignInPage } from '../../pages/sign-in.page';

// L2-080.3 (privacy/record-consent): new terms must be accepted before anything else.
test.describe('Accepting updated terms', () => {
  test('a booker on the March terms is sent to accept the new ones, then goes on', async ({
    page,
  }) => {
    const terms = new AcceptTermsPage(page);
    const account = new AccountPage(page);
    const booker = createBooker(undefined, { terms: '2026-03' });
    await signIn(page.request, booker.email);

    await account.openOnly();

    await expect(terms.heading()).toHaveText('We’ve updated our terms');
    expect(terms.address()).toBe('/account/accept-terms?returnUrl=%2Faccount');
    await expect(terms.lead()).toHaveText('Accept them to keep using Zamaro. Here’s what changed:');
    await expect(terms.changes()).toHaveText([
      'How long booking and payment records are kept after an account is deleted: 7 years, for tax, without your name.',
      'Which payment processor holds card details; Zamaro never sees or stores them.',
      'How Zamaro checks artists who lead youth events.',
    ]);
    await expect(terms.fullTermsLink()).toHaveAttribute('href', 'https://zamaro.ca/legal/terms');
    await expect(terms.finePrint()).toHaveText(
      'Terms of use, version 2026-10, from Thu 8 Oct 2026. Your saved artists and bookings are waiting.',
    );
    await expect(terms.acceptButton()).toBeFocused();

    await terms.accept();

    await expect(account.form()).toBeVisible();
    expect(terms.address()).toBe('/account');
  });

  test('signing in onto a public page asks for the new terms first, then goes on there', async ({
    page,
  }) => {
    const terms = new AcceptTermsPage(page);
    const profile = new ArtistProfilePage(page);
    const signInPage = new SignInPage(page);
    const booker = createBooker(undefined, { terms: '2026-03' });
    await signInPage.open('/artists/abigail-mensah');

    await signInPage.signIn(booker.email, booker.password);

    await expect(terms.heading()).toHaveText('We’ve updated our terms');
    expect(terms.address()).toBe('/account/accept-terms?returnUrl=%2Fartists%2Fabigail-mensah');

    await terms.accept();

    await expect(profile.saveButton()).toBeVisible();
    expect(profile.address()).toBe('/artists/abigail-mensah');
  });

  test('a signed-in call the API stops sends the booker to the terms too', async ({ page }) => {
    const terms = new AcceptTermsPage(page);
    const booker = createBooker(undefined, { terms: '2026-03' });
    await signIn(page.request, booker.email);

    await page.goto('/account/security/mfa');

    await expect(terms.heading()).toHaveText('We’ve updated our terms');
  });

  test('while accepting, the button is busy; a failure records nothing', async ({ page }) => {
    const terms = new AcceptTermsPage(page);
    const booker = createBooker(undefined, { terms: '2026-03' });
    await signIn(page.request, booker.email);
    await terms.open();
    await terms.failAccept();

    await terms.accept();

    await expect(terms.alertTitle()).toHaveText('We couldn’t save your answer');
    await expect(page.getByRole('alert')).toContainText(
      'Zamaro didn’t answer. Nothing was recorded; try again in a minute.',
    );
    await page.unrouteAll();
    await terms.holdAccept();
    await terms.acceptButton().click();
    await expect(terms.acceptButton()).toHaveText('Accepting…');
    await expect(terms.acceptButton()).toHaveAttribute('aria-busy', 'true');
    await expect(terms.signOutButton()).toBeDisabled();
  });

  test('Sign out is the only other way out', async ({ page }) => {
    const terms = new AcceptTermsPage(page);
    const booker = createBooker(undefined, { terms: '2026-03' });
    await signIn(page.request, booker.email);
    await terms.open();

    await terms.signOutButton().click();

    await expect(terms.shell.signInLink()).toBeVisible();
  });
});

// L2-080.4: the marketing choice in account settings.
test.describe('The marketing choice', () => {
  test('ticking “New artists near my church” is saved and kept', async ({ page }) => {
    const account = new AccountPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await account.open();
    await expect(account.alwaysOnChoice()).toBeChecked();
    await expect(account.alwaysOnChoice()).toBeDisabled();
    await expect(account.marketingChoice()).not.toBeChecked();

    await account.marketingChoice().check();
    await account.save();

    await expect(account.status()).toHaveText('Saved just now');
    await account.reload();
    await expect(account.marketingChoice()).toBeChecked();
  });
});
