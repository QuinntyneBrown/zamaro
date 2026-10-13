import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../../fixtures/admin-session';
import { apiJson } from '../../../fixtures/api';
import { ApplicationPage } from '../../../pages/admin/application.page';
import { RejectApplicationDialog } from '../../../pages/admin/reject-application.dialog';

const EBENEZER_ID = 1;
const KEZIA_ID = 2;
const TOBI_ID = 3;

const NOTE =
  'We couldn’t reach Pastor Samuel Osei or Ruth Kim this week. Ask them to expect a call from the Zamaro team, then apply again.';
const BURLINGTON = 'lat=43.325&lng=-79.799&place=Burlington&radius=120';

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

// L2-048.1, L2-048.3, L2-069.1 (review-artist-application): approval grants the role, and the artist
// stays out of search and off the address until payouts are set up.
test.describe('Approving an application', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('with both references verified, Approve grants the role and hides the profile until payout setup', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    await application.open(TOBI_ID);
    await application.ensureReferenceTick(1);
    await application.ensureReferenceTick(2);
    await expect(application.approveButton()).toBeEnabled();

    expect(await application.approve()).toBe(200);

    await expect(application.headBadge()).toHaveText('Approved');
    await expect(application.decisionAlertTitle()).toHaveText('Tobi Adeyemi is approved');
    await expect(application.decisionAlert()).toContainText(
      'We emailed tobi@tobiadeyemi.ca the next step: set up payouts. The profile stays out of search and off its address until payouts are set up.',
    );
    await expect(application.decisionDetail('Decision')).toHaveText(
      'Approved Fri 9 Oct, 10:00 a.m. by Priya Nair',
    );
    await expect(application.decisionDetail('Artist role')).toHaveText('Granted');
    await expect(application.decisionDetail('Public profile')).toHaveText(
      'Hidden until payout setup',
    );
    await expect(application.approveButton()).toHaveCount(0);
    await expect(application.rejectButton()).toHaveCount(0);
    await expect(application.referenceTick(1)).toBeDisabled();

    // Not public yet: no search lists Tobi, and the address is not found.
    const search = await apiJson<{ data: { name: string }[]; headliner: { name: string } | null }>(
      page.request,
      `/api/v1/search?date=2026-11-14&kind=worship-night&${BURLINGTON}`,
    );
    expect([search.headliner?.name, ...search.data.map((row) => row.name)]).not.toContain(
      'Tobi Adeyemi',
    );
    const profile = await page.request.get('/api/v1/artists/tobi-adeyemi', {
      headers: { Referer: 'http://localhost:4000/', Accept: 'application/json' },
    });
    expect(profile.status()).toBe(404);
  });
});

// L2-048.2, L2-101, L2-108 (review-artist-application, dialogs/reject-application): a reason from the
// list is required, the note is counted, both are emailed, and the dialog keeps its choices on failure.
test.describe('Rejecting an application', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('needs a reason, counts the note, and closes the application as Rejected', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    const dialog = new RejectApplicationDialog(page);
    await application.open(KEZIA_ID);

    await application.rejectButton().click();

    await expect(dialog.heading()).toHaveText('Reject Kezia & Mark Thompson’s application?');
    await expect(dialog.kicker()).toHaveText('A-0218 · Submitted · Thu 8 Oct');
    await expect(dialog.description()).toHaveText(
      'Kezia & Mark Thompson is emailed the reason and your note. The application closes as Rejected.',
    );
    await expect(dialog.reason()).toBeFocused();
    await expect(dialog.noteCounter()).toHaveText('0 / 1,000');

    await dialog.rejectButton().click();

    await expect(dialog.errorSummaryTitle()).toHaveText('Choose a reason first');
    await expect(dialog.errorSummary()).toBeFocused();
    await expect(dialog.errorSummaryItems()).toHaveText([
      'Choose the reason Kezia & Mark Thompson will read',
    ]);
    await expect(dialog.reasonError()).toHaveText('Choose a reason from the list.');

    await dialog.note().fill(NOTE);
    await expect(dialog.noteCounter()).toHaveText('125 / 1,000');
    await dialog.reason().selectOption({ label: 'References could not be confirmed' });
    expect(await dialog.send()).toBe(200);

    await expect(dialog.dialog()).toHaveCount(0);
    await expect(application.headBadge()).toHaveText('Rejected');
    await expect(application.decisionAlertTitle()).toHaveText(
      'Kezia & Mark Thompson’s application is rejected',
    );
    await expect(application.decisionDetail('Decision')).toHaveText(
      'Rejected Fri 9 Oct, 10:00 a.m. by Priya Nair',
    );
    await expect(application.decisionDetail('Reason')).toHaveText(
      'References could not be confirmed',
    );
    await expect(application.decisionDetail('Note')).toHaveText(NOTE);
    await expect(application.approveButton()).toHaveCount(0);
    await expect(application.rejectButton()).toHaveCount(0);
  });

  test('Cancel returns focus to Reject…, and a failed rejection keeps the choices for Try again', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    const dialog = new RejectApplicationDialog(page);
    await application.open(EBENEZER_ID);

    await application.rejectButton().click();
    await expect(dialog.dialog()).toBeVisible();
    await dialog.cancelButton().click();

    await expect(dialog.dialog()).toHaveCount(0);
    await expect(application.rejectButton()).toBeFocused();

    await application.rejectButton().click();
    await dialog.reason().selectOption({ label: 'Outside the Zamaro service area' });
    await dialog.note().fill('Oshawa is within the area; the band tours further east.');
    await dialog.failTheNextRejection();
    expect(await dialog.send()).toBe(500);

    await expect(dialog.failedTitle()).toHaveText('The rejection wasn’t saved');
    await expect(dialog.failedAlert()).toContainText(
      'The application is still Submitted and nothing was emailed. Try again in a moment.',
    );
    await expect(dialog.reason()).toHaveValue('outside-service-area');
    await expect(dialog.note()).toHaveValue(
      'Oshawa is within the area; the band tours further east.',
    );
    await expect(dialog.rejectButton()).toHaveText('Try again');

    expect(await dialog.send()).toBe(200);
    await expect(dialog.dialog()).toHaveCount(0);
    await expect(application.headBadge()).toHaveText('Rejected');
  });
});
