import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Browser, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const SHOW = { method: 'get', path: '/account/consents/marketing' };
const SAVE = { method: 'post', path: '/account/consents/marketing' };

interface MarketingRecord extends Record<string, unknown> {
  id: number;
  granted: boolean;
  source: string;
  document_version: string | null;
}

/**
 * L2-080.4 (privacy/record-consent): the marketing choice can change in account settings; each
 * change appends a `settings` record and the earlier ones stay. The latest record is the choice.
 */
describe('the marketing choice', () => {
  let naomi: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    naomi = await signedIn(NAOMI);
  });

  it('reads the choice from the latest record', async () => {
    const response = await naomi.json('/api/v1/account/consents/marketing', 'GET');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { granted: false } });
    expectContract(response, SHOW, { data: { granted: false } });
  });

  it('appends a settings record when the box is ticked and keeps the earlier ones', async () => {
    const earlier = await records();

    const response = await naomi.json('/api/v1/account/consents/marketing', 'POST', {
      granted: true,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { granted: true } });
    expectContract(response, SAVE, { data: { granted: true } });
    const after = await records();
    expect(after).toHaveLength(earlier.length + 1);
    expect(after.slice(0, earlier.length).map((record) => record.id)).toEqual(
      earlier.map((record) => record.id),
    );
    const last = after[after.length - 1];
    expect(last?.granted).toBe(true);
    expect(last?.source).toBe('settings');
    expect(last?.document_version).toBeNull();
    expect(await choice()).toBe(true);

    const untick = await naomi.json('/api/v1/account/consents/marketing', 'POST', {
      granted: false,
    });
    expect(untick.status).toBe(200);
    expect(await choice()).toBe(false);
  });

  it('needs a yes or a no', async () => {
    const response = await naomi.json('/api/v1/account/consents/marketing', 'POST', {
      granted: 'maybe',
    });

    expect(response.status).toBe(422);
    expect(((await response.json()) as { errors: object }).errors).toHaveProperty('granted');
  });

  async function choice(): Promise<boolean> {
    const response = await naomi.json('/api/v1/account/consents/marketing', 'GET');
    return ((await response.json()) as { data: { granted: boolean } }).data.granted;
  }

  function records(): Promise<MarketingRecord[]> {
    return query<MarketingRecord>(
      sql`select c.id, c.granted, c.source::text as source, c.document_version
          from consent_records c join users u on u.id = c.user_id
          where u.email = ${NAOMI} and c.kind = 'marketing-email' order by c.id`,
    );
  }
});
