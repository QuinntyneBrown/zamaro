import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../fixtures/admin-session';
import { AuditLogPage } from '../../pages/admin/audit-log.page';

// L2-069.2–.3, L2-095.1, L2-105 (record-audit-log): the read-only audit log viewer.
test.describe('The audit log', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('lists entries newest first, with the filters and no way to change them', async ({
    page,
  }) => {
    const log = new AuditLogPage(page);

    await log.open();
    await log.waitForRows();

    await expect(log.heading()).toHaveText('Audit log');
    await expect(log.subtitle()).toHaveText(
      'Every sign-in, credential change, refund, payout and administrator action. Entries can’t be changed and are deleted after 2 years.',
    );
    await expect(log.actorField()).toBeVisible();
    await expect(log.actionField()).toHaveValue('');
    await expect(log.actionField().locator('option').first()).toHaveText('All actions');
    await expect(log.targetField()).toBeVisible();
    await expect(log.outcomeField().locator('option').first()).toHaveText('Any outcome');
    await expect(log.fromField()).toHaveValue('2026-10-01');
    await expect(log.toField()).toHaveValue('2026-10-09');
    await expect(log.caption()).toHaveText('Thu 1 Oct to Fri 9 Oct 2026, newest first');
    await expect(log.headers()).toHaveText([
      'When',
      'Actor',
      'Action',
      'Target',
      'IP address',
      'Outcome',
    ]);
    await expect(log.headers().first()).toHaveAttribute('aria-sort', 'descending');

    // Priya's own sign-in just now: the code step, then the sign-in, newest first.
    const newest = log.row(0);
    await expect(newest.when()).toHaveText('Fri 9 Oct, 10:00 a.m.');
    await expect(newest.actorName()).toHaveText('Priya Nair');
    await expect(newest.actorCaption()).toHaveText('priya@zamaro.ca · Administrator');
    await expect(newest.action()).toHaveText('auth.sign_in');
    await expect(newest.target()).toHaveText('User · Priya Nair');
    await expect(newest.address()).not.toBeEmpty();
    await expect(newest.outcome()).toHaveText('Succeeded');
    await expect(log.row(1).action()).toHaveText('auth.mfa_challenge');
    await expect(page.getByRole('button', { name: /^(Edit|Delete)/ })).toHaveCount(0);
  });

  test('a filter with no matches says so, and Clear filters brings the entries back', async ({
    page,
  }) => {
    const log = new AuditLogPage(page);
    await log.open();
    await log.waitForRows();

    await log.filterByAction('artist.reinstated');

    await expect(log.noResultsTitle()).toHaveText('No entries match these filters');
    await expect(log.table()).toHaveCount(0);

    await log.clearFilters();

    await log.waitForRows();
    await expect(log.actionField()).toHaveValue('');
  });

  test('while loading the table shows skeleton rows; a failure offers Try again', async ({
    page,
  }) => {
    const log = new AuditLogPage(page);
    await log.holdEntries();
    await log.open();

    await expect(log.caption()).toContainText('Thu 1 Oct to Fri 9 Oct 2026, newest first');
    expect(await log.isBusy()).toBe(true);
    await expect(log.skeletonRows()).not.toHaveCount(0);

    await log.answerNormally();
    await log.failEntries();
    await log.open();

    await expect(log.errorTitle()).toHaveText('We couldn’t load the audit log');
    await expect(log.errorAlert()).toContainText('Your filters are kept.');
    await log.answerNormally();
    await log.tryAgainButton().click();
    await log.waitForRows();
  });
});
