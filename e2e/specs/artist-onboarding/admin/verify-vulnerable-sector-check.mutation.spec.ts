import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../../fixtures/admin-session';
import { apiJson } from '../../../fixtures/api';
import { ChecksPage } from '../../../pages/admin/checks.page';

/** Burlington, as the Discover quick-pick chip sends it. */
const BURLINGTON = { lat: '43.325', lng: '-79.799' };

// L2-049.2, L2-069.1, L2-005.5 (verify-vulnerable-sector-check): Priya verifies Elijah Park's first
// check. This changes the seed, so it runs in the admin-mutations project, after the read-only admin
// suite, and the project's teardown seeds the database again.
test.describe('Verifying a check', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('counts it for 3 years from its issue date, is audited, and admits the artist to Youth events', async ({
    page,
  }) => {
    const checks = new ChecksPage(page);
    await checks.open();
    await checks.waitForRows();
    const elijah = checks.rowFor('Elijah Park');

    const status = await checks.verify(elijah);

    expect(status).toBe(200);
    await expect(elijah.checkBadge()).toHaveText('Verified');
    await expect(elijah.check()).toHaveText('Verified until Tue 25 Sep 2029 · by Priya Nair');
    await expect(elijah.verifyButton()).toHaveCount(0);
    await expect(elijah.viewDocumentButton()).toBeVisible();
    await expect(checks.subtitle()).toHaveText(
      '1 waiting · a verified check counts for 3 years from its issue date',
    );
    await expect(checks.caption()).toHaveText('Checks uploaded since Wed 7 Oct, oldest first');
    await expect(checks.rowFor('Abigail Mensah').verifyButton()).toBeVisible();

    // The decision is in the audit log (L2-069.1)...
    const audit = await apiJson<{ data: { actor: { name: string }; outcome: string }[] }>(
      page.request,
      '/api/v1/admin/audit-entries?action=vsc.verified',
    );
    expect(audit.data[0]?.actor.name).toBe('Priya Nair');
    expect(audit.data[0]?.outcome).toBe('succeeded');

    // ...and Elijah now appears in a Youth event search on Sat 14 Nov (L2-005.5).
    const search = await apiJson<{ headliner: { name: string } | null; data: { name: string }[] }>(
      page.request,
      `/api/v1/search?date=2026-11-14&kind=youth-event&radius=120&lat=${BURLINGTON.lat}&lng=${BURLINGTON.lng}`,
    );
    const names = [search.headliner?.name, ...search.data.map((artist) => artist.name)];
    expect(names).toContain('Elijah Park');
  });
});
