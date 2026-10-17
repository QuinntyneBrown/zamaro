import { randomBytes } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { reloadSecurityConfig } from '@config/security';
import { NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const ORIGINAL = {
  version: process.env.FIELD_ENCRYPTION_KEY_VERSION ?? 'v1',
  key: process.env.FIELD_ENCRYPTION_KEY ?? '',
  previous: process.env.FIELD_ENCRYPTION_PREVIOUS_KEYS ?? '',
};

/**
 * L2-079.2 (security/protect-secrets-and-data): phone numbers are encrypted by the API with a field
 * key held outside the database. Each value names its key version, so values written under an
 * earlier key still read after the key changes.
 */
describe('field encryption', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  afterEach(() => {
    useKeys(ORIGINAL.version, ORIGINAL.key, ORIGINAL.previous);
  });

  it('stores no phone number in plain text', async () => {
    const churchPhones = await query<{ phone: string }>(sql`select phone from churches`);
    const artistPhones = await query<{ contact_phone: string }>(
      sql`select contact_phone from artists where contact_phone is not null`,
    );

    expect(churchPhones.length).toBeGreaterThan(0);
    expect(artistPhones.length).toBeGreaterThan(0);
    for (const stored of [
      ...churchPhones.map((row) => row.phone),
      ...artistPhones.map((row) => row.contact_phone),
    ]) {
      expect(stored).toMatch(/^v1:/);
      expect(stored).not.toMatch(/\d{3}.?555/);
    }
  });

  it('still reads a value written under an earlier key, and writes new values with the new one', async () => {
    useKeys('v2', `base64:${randomBytes(32).toString('base64')}`, `v1:${ORIGINAL.key}`);
    const browser = await signedIn(NAOMI);

    const shown = await browser.json('/api/v1/account/church', 'GET');
    expect(shown.status).toBe(200);
    const church = ((await shown.json()) as { data: Record<string, unknown> }).data;
    expect(church.phone).toBe('905-555-0123');

    expect((await browser.json('/api/v1/account/church', 'PUT', church)).status).toBe(200);
    const [row] = await query<{ phone: string }>(
      sql`select phone from churches where name = 'Riverside Community Church'`,
    );
    expect(row?.phone.startsWith('v2:')).toBe(true);
  });

  it('never reads a value under an unknown key as plain text', async () => {
    useKeys('v2', `base64:${randomBytes(32).toString('base64')}`, '');
    const browser = await signedIn(NAOMI);

    expect((await browser.json('/api/v1/account/church', 'GET')).status).toBe(500);
  });

  function useKeys(version: string, key: string, previous: string): void {
    process.env.FIELD_ENCRYPTION_KEY_VERSION = version;
    process.env.FIELD_ENCRYPTION_KEY = key;
    process.env.FIELD_ENCRYPTION_PREVIOUS_KEYS = previous;
    reloadSecurityConfig();
  }
});
