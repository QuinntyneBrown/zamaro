import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../fixtures/admin-session';
import { passTime, startClock } from '../../fixtures/clock';
import { AdminShell } from '../../pages/admin/admin-shell';
import { SessionToast } from '../../pages/admin/session-toast';
import { Session } from '../../pages/session';

const MINUTE = 60_000;
const APPLICATIONS = '/admin/applications';

// L2-066.3, L2-109.4 (secure-admin-access): 28 minutes after the last admin request a warning stays
// until the administrator acts; Stay signed in counts as activity.
test.describe('The idle-session warning', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
    await startClock(page);
  });

  test('appears after 28 idle minutes, does not leave on its own, and Stay signed in dismisses it', async ({
    page,
  }) => {
    const admin = new AdminShell(page);
    const toast = new SessionToast(page);
    await page.goto(APPLICATIONS, { waitUntil: 'networkidle' });
    await admin.waitForAdministrator();

    await passTime(page, 27 * MINUTE);
    await expect(toast.root).toHaveCount(0);
    await passTime(page, 1 * MINUTE);

    await expect(toast.root).toBeVisible();
    await expect(toast.kind()).toHaveText('Heads up');
    await expect(toast.title()).toHaveText('You’ll be signed out in 2 minutes.');
    await expect(toast.text()).toHaveText('Admin sessions end after 30 minutes without activity.');
    await expect(toast.progress()).toHaveCount(0);
    await passTime(page, 10 * MINUTE);
    await expect(toast.root).toBeVisible();

    expect(await toast.staySignedIn()).toBe(200);

    await expect(toast.root).toHaveCount(0);
    await passTime(page, 27 * MINUTE);
    await expect(toast.root).toHaveCount(0);
    await passTime(page, 1 * MINUTE);
    await expect(toast.root).toBeVisible();
  });

  test('once the session has ended on the server, the next request sends the administrator to sign in', async ({
    page,
  }) => {
    const admin = new AdminShell(page);
    const toast = new SessionToast(page);
    const session = new Session(page);
    await page.goto(APPLICATIONS, { waitUntil: 'networkidle' });
    await admin.waitForAdministrator();
    await passTime(page, 28 * MINUTE);
    await expect(toast.root).toBeVisible();
    await session.endOnServer();

    await toast.stayButton().click();

    await expect(page).toHaveURL(`/sign-in?returnUrl=${encodeURIComponent(APPLICATIONS)}&ended=1`);
  });
});
