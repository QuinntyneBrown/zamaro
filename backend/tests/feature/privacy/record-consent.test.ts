import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser } from '../../support/accounts';
import { api } from '../../support/app';
import { resetClock, travelTo } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const REGISTER = { method: 'post', path: '/register' };
const CURRENT = { method: 'get', path: '/legal-documents/current' };
const EMAIL = 'ruth.adeyemi@gracepoint.ca';

interface ConsentRecord {
  id: number;
  kind: string;
  document_version: string | null;
  granted: boolean;
  recorded_at: string;
  source: string;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * L2-080.1–.2: registration stores the terms and privacy policy versions accepted, and the separate
 * marketing choice, each with the time, as CASL evidence. Records are never changed
 * (privacy/record-consent).
 */
describe('record consent', () => {
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    browser = new Browser();
    browser.address = '203.0.113.24';
    await browser.request('/api/v1/csrf-cookie');
  });

  it('records the terms, the privacy policy and the marketing choice at registration', async () => {
    expect((await register()).status).toBe(202);

    const records = await consentRecords();
    expect(records.map((record) => [record.kind, record.document_version, record.granted])).toEqual(
      [
        ['terms', '2026-10', true],
        ['privacy-policy', '2026-10', true],
        ['marketing-email', null, false],
      ],
    );
    for (const record of records) {
      expect(new Date(record.recorded_at).toISOString()).toBe('2026-10-09T14:00:00.000Z');
      expect(record.source).toBe('registration');
      expect(record.ip_address).toBe('203.0.113.24');
      expect(record.user_agent).toBe('Mozilla/5.0 (Windows NT 10.0) Chrome/130');
    }
  });

  it('records marketing consent as granted when the news box is ticked', async () => {
    expect((await register({ marketingOptIn: true })).status).toBe(202);

    const marketing = (await consentRecords()).find((record) => record.kind === 'marketing-email');
    expect(marketing?.granted).toBe(true);
  });

  it('refuses versions that are no longer current and writes nothing', async () => {
    const response = await register({ termsVersion: '2026-03' });

    expect(response.status).toBe(409);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/legal-document-outdated`);
    expectContract(response, REGISTER, body);
    expect(await query(sql`select id from users where email = ${EMAIL}`)).toEqual([]);
    expect((await register({ privacyPolicyVersion: '2025-01' })).status).toBe(409);
  });

  it('never changes or deletes a consent record', async () => {
    expect((await register()).status).toBe(202);
    const [record] = await consentRecords();
    const id = record?.id ?? 0;

    await expect(
      query(sql`update consent_records set granted = false where id = ${id}`),
    ).rejects.toThrow(/append-only/);
    await expect(query(sql`delete from consent_records where id = ${id}`)).rejects.toThrow(
      /append-only/,
    );
  });

  it('publishes the current versions', async () => {
    const response = await api('/api/v1/legal-documents/current');

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { terms: Record<string, unknown>; privacyPolicy: Record<string, unknown> };
    };
    expect(body.data.terms.version).toBe('2026-10');
    expect(body.data.terms.effectiveFrom).toBe('2026-10-08');
    expect(body.data.privacyPolicy.version).toBe('2026-10');
    expectContract(response, CURRENT, body);
  });

  it('had the March terms current before Thu 8 Oct', async () => {
    travelTo('2026-10-07 12:00');

    const body = (await (await api('/api/v1/legal-documents/current')).json()) as {
      data: { terms: { version: string } };
    };

    expect(body.data.terms.version).toBe('2026-03');
  });

  function register(overrides: Record<string, unknown> = {}): Promise<Response> {
    return browser.request('/api/v1/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130',
      },
      body: JSON.stringify({
        name: 'Ruth Adeyemi',
        email: EMAIL,
        password: 'hosanna-in-the-highest',
        acceptedTerms: true,
        marketingOptIn: false,
        termsVersion: '2026-10',
        privacyPolicyVersion: '2026-10',
        challengeToken: 'pass',
        ...overrides,
      }),
    });
  }

  function consentRecords(): Promise<ConsentRecord[]> {
    return query<ConsentRecord>(
      sql`select c.id, c.kind::text as kind, c.document_version, c.granted, c.recorded_at,
                 c.source::text as source, c.ip_address, c.user_agent
          from consent_records c join users u on u.id = c.user_id
          where u.email = ${EMAIL} order by c.id`,
    );
  }
});
