import { expect, test } from '@playwright/test';
import { accounts, CAST_PASSWORD, PRIYA_TOTP_SECRET, signInAs } from '../../fixtures/accounts';
import { signInAsAdministrator } from '../../fixtures/admin-session';
import { totp } from '../../fixtures/totp';
import { AdminShell } from '../../pages/admin/admin-shell';
import { MfaChallengePage } from '../../pages/mfa-challenge.page';
import { NotFoundPage } from '../../pages/not-found.page';
import { SignInPage } from '../../pages/sign-in.page';

const APPLICATIONS = '/admin/applications';

// L2-066.1 (secure-admin-access): the admin area answers 404 to anyone without the Administrator role.
test.describe('The admin area is hidden from everyone else', () => {
  test('a booker who opens an admin address gets the not-found page with a real 404', async ({
    page,
  }) => {
    const notFound = new NotFoundPage(page);
    await signInAs(page.context(), 'naomi');

    const status = await notFound.open(APPLICATIONS);

    expect(status).toBe(404);
    await expect(notFound.heading()).toHaveText('No show');
    expect((await notFound.ask(APPLICATIONS)).status).toBe(404);
  });

  test('a guest gets the same 404', async ({ page }) => {
    const notFound = new NotFoundPage(page);

    expect(await notFound.open(APPLICATIONS)).toBe(404);
    await expect(notFound.heading()).toHaveText('No show');
  });
});

// L2-066.2: an administrator signs in with a code and lands in the admin application.
test.describe('An administrator signs in with a code', () => {
  test('the code step completes the sign-in and continues into the admin application', async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    const challenge = new MfaChallengePage(page);
    const admin = new AdminShell(page);

    await signIn.open(APPLICATIONS);
    await signIn.signIn(accounts.priya.email, CAST_PASSWORD);

    await challenge.waitForIt();
    await expect(challenge.fieldHelp()).toHaveText(`Signing in as ${accounts.priya.email}.`);
    await challenge.verify(totp(PRIYA_TOTP_SECRET));

    await admin.waitForAdministrator();
    expect(admin.path()).toBe(APPLICATIONS);
    await expect(admin.roleTag()).toHaveText('Admin');
    await expect(admin.heading()).toHaveText('Applications');
  });
});

// L2-087, L2-099, L2-101, L2-104: the admin workspace shell.
test.describe('The admin workspace', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('shows the Admin tag, the built sections, the avatar and the admin footer', async ({
    page,
  }) => {
    const admin = new AdminShell(page);
    await admin.shell.useWidth(1280);

    await admin.open(APPLICATIONS);
    await admin.waitForAdministrator();

    await expect(admin.roleTag()).toHaveText('Admin');
    await expect(admin.sectionLinks()).toHaveText(['Applications', 'Artists', 'Audit log']);
    await expect(admin.shell.accountButton()).toHaveAccessibleName('Account menu for Priya Nair');
    await expect(admin.shell.accountButton()).toHaveText('PN');
    await expect(admin.footerHeadings()).toHaveText(['Admin', 'Records', 'Priya Nair']);
    await expect(admin.footerColumn('Priya Nair')).toHaveText(['Zamaro team', 'hello@zamaro.ca']);
    expect(await admin.shell.landmarkCounts()).toEqual({
      banner: 1,
      main: 1,
      contentinfo: 1,
      h1: 1,
    });
  });

  test('below 1200 px the sections move into the drawer, and Escape returns focus to the menu button', async ({
    page,
  }) => {
    const admin = new AdminShell(page);
    await admin.shell.useWidth(1100);
    await admin.open(APPLICATIONS);
    await admin.waitForAdministrator();
    await expect(admin.sectionLinks()).toHaveCount(0);

    const menu = await admin.openMenu();

    await expect(menu.dialog()).toBeVisible();
    await expect(menu.description()).toHaveText('Your account stays in the top bar.');
    await expect(menu.links()).toHaveText(['Applications', 'Artists', 'Audit log']);
    expect(await menu.focusIsInside()).toBe(true);

    await menu.closeWithEscape();

    await expect(menu.dialog()).toHaveCount(0);
    await expect(admin.shell.menuButton()).toBeFocused();
  });

  test('the account menu names the administrator and signs out to the public site', async ({
    page,
  }) => {
    const admin = new AdminShell(page);
    await admin.open(APPLICATIONS);
    await admin.waitForAdministrator();

    const account = await admin.openAccountMenu();
    await expect(account.whoName()).toHaveText('Priya Nair');
    await expect(account.who()).toContainText('Zamaro team');
    await account.signOut();

    await expect(page).toHaveURL(/\/$/);
    expect(await new NotFoundPage(page).open(APPLICATIONS)).toBe(404);
  });
});
