import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../../fixtures/admin-session';
import { ApplicationPage } from '../../../pages/admin/application.page';

const TOBI_ID = 3;

// L2-048.1, L2-069.1 (review-artist-application): each reference tick saves at once, names who and
// when, and Approve opens once both are verified. Runs in admin-mutations: the reseed restores the ticks.
test.describe('Verifying church references', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('a tick saves at once, names who and when, and both ticks open Approve', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    await application.open(TOBI_ID);
    await expect(application.panelCaption('Church references')).toHaveText('0 of 2 verified');

    expect(await application.setReferenceTick(1, true)).toBe(200);

    await expect(application.referenceTick(1)).toBeChecked();
    await expect(application.referenceTickDescription(1)).toHaveText(
      'Verified by Priya Nair, Fri 9 Oct, 10:00 a.m.',
    );
    await expect(application.panelCaption('Church references')).toHaveText('1 of 2 verified');
    await expect(application.approveButton()).toBeDisabled();

    expect(await application.setReferenceTick(2, true)).toBe(200);

    await expect(application.panelCaption('Church references')).toHaveText('2 of 2 verified');
    await expect(application.approveHelp()).toHaveText('Both references verified.');
    await expect(application.approveButton()).toBeEnabled();

    // Reloading shows the saved ticks; unticking clears who and when.
    await page.reload();
    await expect(application.referenceTick(1)).toBeChecked();
    await expect(application.referenceTick(2)).toBeChecked();

    expect(await application.setReferenceTick(2, false)).toBe(200);

    await expect(application.referenceTick(2)).not.toBeChecked();
    await expect(application.referenceTickDescription(2)).toHaveText(
      'Call or email them, then tick when they vouch for Tobi.',
    );
    await expect(application.panelCaption('Church references')).toHaveText('1 of 2 verified');
    await expect(application.approveHelp()).toHaveText(
      'Verify both references before you approve.',
    );
    await expect(application.approveButton()).toBeDisabled();
  });
});
