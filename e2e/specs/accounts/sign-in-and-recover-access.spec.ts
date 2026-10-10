import { expect, test } from '@playwright/test';
import { accounts, CAST_PASSWORD, createBooker, uniqueEmail } from '../../fixtures/accounts';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
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
