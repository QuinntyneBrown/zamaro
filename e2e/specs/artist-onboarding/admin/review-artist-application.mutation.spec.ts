import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../../fixtures/admin-session';
import { apiJson } from '../../../fixtures/api';
import { waitForEmail } from '../../../fixtures/mailbox';
import { ApplicationPage } from '../../../pages/admin/application.page';
import { ApplicationsPage } from '../../../pages/admin/applications.page';
import { RejectApplicationDialog } from '../../../pages/admin/reject-application.dialog';

/** Tobi Adeyemi's A-0219: the third seeded application. */
const TOBI_ID = 3;
/** Kezia & Mark Thompson's A-0218: the second seeded application. */
const KEZIA_ID = 2;

// L2-048.1, L2-048.3, L2-063, L2-069.1 (review-artist-application): Priya verifies both of Tobi's
// references and approves him. This changes the seed, so it runs in the admin-mutations project,
// after the read-only admin suite, and the project's teardown seeds the database again.
test.describe('Approving an application', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('needs both references verified, then grants the Artist role and emails the next step', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    await application.open(TOBI_ID);
    await expect(application.approveButton()).toBeDisabled();

    // The first tick saves at once and is signed...
    const first = application.reference(0);
    expect(await first.setVerified(true)).toBe(200);
    await expect(first.description()).toHaveText('Verified by Priya Nair, Fri 9 Oct, 10:00 a.m.');
    await expect(application.referencesCaption()).toHaveText('1 of 2 verified');
    await expect(application.approveButton()).toBeDisabled();

    // ...and the second one unlocks Approve.
    expect(await application.reference(1).setVerified(true)).toBe(200);
    await expect(application.referencesCaption()).toHaveText('2 of 2 verified');
    await expect(application.approveHelp()).toHaveText('Both references verified.');
    await expect(application.approveButton()).toBeEnabled();

    expect(await application.approve()).toBe(200);

    await expect(application.headBadge()).toHaveText('Approved');
    await expect(application.approvedNotice()).toContainText('Tobi Adeyemi is approved');
    await expect(application.approvedNotice()).toContainText(
      'We emailed tobi@tobiadeyemi.ca the next step: set up payouts.',
    );
    await expect(application.decided('Decision')).toHaveText(
      'Approved Fri 9 Oct, 10:00 a.m. by Priya Nair',
    );
    await expect(application.decided('Artist role')).toHaveText('Granted');
    await expect(application.decided('Public profile')).toHaveText('Hidden until payout setup');
    await expect(application.approveButton()).toHaveCount(0);
    await expect(application.rejectButton()).toHaveCount(0);
    await expect(application.reference(0).verifiedBox()).toBeDisabled();

    // Tobi is emailed the next step (L2-048.1, L2-063)...
    const email = await waitForEmail('tobi@tobiadeyemi.ca', /approved/i);
    expect(email.text).toContain('payout');

    // ...the decision is audited (L2-069.1)...
    const audit = await apiJson<{ data: { actor: { name: string }; outcome: string }[] }>(
      page.request,
      '/api/v1/admin/audit-entries?action=application.approved',
    );
    expect(audit.data[0]?.actor.name).toBe('Priya Nair');
    expect(audit.data[0]?.outcome).toBe('succeeded');

    // ...and the profile stays hidden until payout setup (L2-048.3).
    const profile = await page.request.get('/api/v1/artists/tobi-adeyemi');
    expect(profile.status()).toBe(404);
  });
});

// L2-048.2, L2-063, L2-069.1 (review-artist-application): Priya rejects Kezia & Mark Thompson's
// application with a reason and a note; both reach the applicants by email and the queue drops it.
test.describe('Rejecting an application', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('closes the application as Rejected, emails the reason and note, and is audited', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    const dialog = new RejectApplicationDialog(page);
    await application.open(KEZIA_ID);
    await application.rejectButton().click();
    await dialog.fill(
      'Videos don’t show you leading worship',
      'Send a recording of you leading a congregation and we will look again.',
    );

    expect(await dialog.submit()).toBe(200);

    await expect(dialog.dialog()).toHaveCount(0);
    await expect(application.headBadge()).toHaveText('Rejected');
    await expect(application.decided('Decision')).toHaveText(
      'Rejected Fri 9 Oct, 10:00 a.m. by Priya Nair',
    );
    await expect(application.decided('Reason')).toHaveText('Videos don’t show you leading worship');
    await expect(application.decided('Note')).toHaveText(
      'Send a recording of you leading a congregation and we will look again.',
    );
    await expect(application.approveButton()).toHaveCount(0);
    await expect(application.reference(0).verifiedBox()).toBeDisabled();

    // The applicants read the reason and the note (L2-048.2, L2-063)...
    const email = await waitForEmail('kezia.mark@example.com', /application/i);
    expect(email.text).toContain("Videos don't show you leading worship");
    expect(email.text).toContain(
      'Send a recording of you leading a congregation and we will look again.',
    );

    // ...the decision is audited (L2-069.1)...
    const audit = await apiJson<{ data: { actor: { name: string }; outcome: string }[] }>(
      page.request,
      '/api/v1/admin/audit-entries?action=application.rejected',
    );
    expect(audit.data[0]?.actor.name).toBe('Priya Nair');
    expect(audit.data[0]?.outcome).toBe('succeeded');

    // ...and the queue no longer lists it.
    const queue = new ApplicationsPage(page);
    await queue.open();
    await queue.waitForRows();
    await expect(queue.rows()).toHaveCount(2);
    await expect(queue.rowFor('Kezia & Mark Thompson').root).toHaveCount(0);
  });
});
