import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { db } from '@/server/db/client';
import { legalDocuments } from '@/server/db/schema';
import { ConsentKind } from '@/server/enums';
import { Browser, NAOMI, signedIn, TOMI } from '../../support/accounts';
import { resetClock, travelTo } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const ACCEPT = { method: 'post', path: '/account/consents/terms' };
const CHURCH = { method: 'get', path: '/account/church' };

/**
 * L2-080.3 (privacy/record-consent): a person who has not accepted the current terms is stopped on
 * every signed-in call but sign-out and `/me` until they accept them; the acceptance is recorded with
 * the version they saw. A new privacy policy alone does not stop anyone (M2 D15).
 */
describe('accepting new terms', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  it('says in me who must accept the new terms', async () => {
    const tomi = new Browser();
    const signIn = await tomi.signIn(TOMI);
    expect(signIn.status).toBe(200);
    expect(await termsRequired(signIn)).toBe(true);
    expect(await termsRequired(await tomi.json('/api/v1/me', 'GET'))).toBe(true);

    expect(await termsRequired(await new Browser().signIn(NAOMI))).toBe(false);
  });

  it('gives every other signed-in call 409 until then', async () => {
    const tomi = await signedIn(TOMI);

    const response = await tomi.json('/api/v1/account/church', 'GET');

    expect(response.status).toBe(409);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/terms-acceptance-required`);
    expectContract(response, CHURCH, body);
    const rename = await tomi.json('/api/v1/account/profile', 'PUT', { name: 'Tomi Oduya' });
    expect(rename.status).toBe(409);
    expect((await tomi.json('/api/v1/session', 'DELETE')).status).toBe(204);
  });

  it('leaves the anonymous routes open, so the terms page can load its catalogue', async () => {
    const tomi = await signedIn(TOMI);

    expect((await tomi.json('/api/v1/i18n/en', 'GET')).status).toBe(200);
    expect((await tomi.json('/api/v1/legal-documents/current', 'GET')).status).toBe(200);
    expect((await tomi.json('/api/v1/features', 'GET')).status).toBe(200);
  });

  it('records the version seen and opens the account again', async () => {
    const tomi = await signedIn(TOMI);
    const tomiId = await idOf(TOMI);
    const before = await consentCount(tomiId);

    const response = await tomi.json('/api/v1/account/consents/terms', 'POST', {
      termsVersion: '2026-10',
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { termsAcceptanceRequired: boolean } };
    expect(body.data.termsAcceptanceRequired).toBe(false);
    expectContract(response, ACCEPT, body);
    expect(await consentCount(tomiId)).toBe(before + 1);
    const [record] = await query<{
      kind: string;
      document_version: string;
      granted: boolean;
      source: string;
      ip_address: string | null;
    }>(
      sql`select kind::text as kind, document_version, granted, source::text as source, ip_address
          from consent_records where user_id = ${tomiId} order by id desc limit 1`,
    );
    expect([record?.kind, record?.document_version, record?.granted, record?.source]).toEqual([
      ConsentKind.Terms,
      '2026-10',
      true,
      'terms-update',
    ]);
    expect(record?.ip_address).not.toBeNull();
    expect((await tomi.json('/api/v1/account/church', 'GET')).status).toBe(200);
  });

  it('refuses a version no longer current and writes nothing', async () => {
    const tomi = await signedIn(TOMI);
    const before = await consentCount();

    const response = await tomi.json('/api/v1/account/consents/terms', 'POST', {
      termsVersion: '2026-03',
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/legal-document-outdated`);
    expectContract(response, ACCEPT, body);
    expect(await consentCount()).toBe(before);
  });

  it('stops no one for a new privacy policy alone', async () => {
    await db().insert(legalDocuments).values({
      kind: ConsentKind.PrivacyPolicy,
      version: '2026-11',
      effectiveFrom: '2026-11-01',
      url: 'https://zamaro.ca/legal/privacy',
      summaryOfChanges: [],
    });
    travelTo('2026-11-02 10:00');

    const naomi = new Browser();
    expect(await termsRequired(await naomi.signIn(NAOMI))).toBe(false);
    expect((await naomi.json('/api/v1/account/church', 'GET')).status).toBe(200);
  });

  it('stops nobody before the new terms take effect', async () => {
    travelTo('2026-10-07 10:00');

    const tomi = new Browser();
    expect(await termsRequired(await tomi.signIn(TOMI))).toBe(false);
    expect((await tomi.json('/api/v1/account/church', 'GET')).status).toBe(200);
  });

  it('gives a guest 401', async () => {
    const guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');

    const response = await guest.json('/api/v1/account/consents/terms', 'POST', {
      termsVersion: '2026-10',
    });

    expect(response.status).toBe(401);
  });

  async function termsRequired(response: Response): Promise<boolean> {
    const body = (await response.json()) as { data: { termsAcceptanceRequired: boolean } };
    return body.data.termsAcceptanceRequired;
  }

  async function idOf(email: string): Promise<number> {
    const [row] = await query<{ id: number }>(sql`select id from users where email = ${email}`);
    return row?.id ?? 0;
  }

  async function consentCount(userId?: number): Promise<number> {
    const where = userId === undefined ? sql`` : sql`where user_id = ${userId}`;
    const [row] = await query<{ total: number }>(
      sql`select count(*)::int as total from consent_records ${where}`,
    );
    return row?.total ?? 0;
  }
});
