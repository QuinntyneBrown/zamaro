import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { castBooker } from '@/cli/cast-booker';
import { db } from '@/server/db/client';
import { users, vulnerableSectorChecks } from '@/server/db/schema';
import { Role, VscStatus } from '@/server/enums';
import { grantRoles } from '@/server/services/accounts/roles';
import { storeDocument } from '@/server/services/artist-onboarding/document-vault';
import { ABIGAIL, Browser, NAOMI, signedIn } from '../../support/accounts';
import { expectConcealed, unknownAddressProblem } from '../../support/admin';
import { resetClock } from '../../support/clock';
import { closeDatabase, freshDatabase, query } from '../../support/database';

/**
 * L2-049.4, L2-074.2 (verify-vulnerable-sector-check): anyone but the check's owner and an
 * administrator gets the same 404 for its document link as for a check that does not exist.
 */
describe('access to a check document', () => {
  let checkId: number;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    const stored = await storeDocument(Buffer.from('%PDF-1.4'));
    const [abigail] = await query<{ id: number }>(
      sql`select id from users where email = ${ABIGAIL}`,
    );
    const [check] = await db()
      .insert(vulnerableSectorChecks)
      .values({
        userId: abigail?.id ?? 0,
        issuedOn: '2026-10-05',
        status: VscStatus.Pending,
        storageKey: stored.key,
        wrappedDataKey: stored.wrappedDataKey,
        mimeType: 'application/pdf',
      })
      .returning({ id: vulnerableSectorChecks.id });
    checkId = check?.id ?? 0;
  });

  it('gives another artist, a booker and a guest the same 404 as an unknown check', async () => {
    // Elijah, another artist, gets a password to sign in with.
    const elijah = 'elijah-park@cast.zamaro.test';
    await castBooker(elijah);
    const [elijahRow] = await db()
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.email} = ${elijah}`);
    await grantRoles(db(), elijahRow?.id ?? 0, [Role.Artist]);
    const unknown = await unknownAddressProblem();

    for (const email of [elijah, NAOMI]) {
      const browser = await signedIn(email);
      await expectConcealed(
        await browser.json(
          `/api/v1/vulnerable-sector-checks/${String(checkId)}/document-link`,
          'GET',
        ),
        unknown,
        email,
      );
      await expectConcealed(
        await browser.json('/api/v1/vulnerable-sector-checks/999999/document-link', 'GET'),
        unknown,
        `${email}, unknown id`,
      );
    }
    const guest = new Browser();
    expect(
      (await guest.json(`/api/v1/vulnerable-sector-checks/${String(checkId)}/document-link`, 'GET'))
        .status,
    ).toBe(401);
  });
});
