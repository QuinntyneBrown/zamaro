import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { reloadConfig } from '@config/zamaro';
import { castBooker } from '@/cli/cast-booker';
import { closeDatabase, freshDatabase, query } from '../../support/database';

/**
 * `cast:booker` (M2 plan D19): e2e specs that change data get a fresh booker who can sign in, and
 * production never gets one. Signing in with the cast password is proven with the session slice.
 */
describe('cast:booker', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  afterEach(() => {
    process.env.ZAMARO_ENV = 'test';
    reloadConfig();
  });

  it('makes a verified booker who accepted the current terms', async () => {
    await castBooker('booker-1@e2e.zamaro.test');

    const [user] = await query(sql`
      SELECT u.name, u.email_verified_at IS NOT NULL AS verified,
             (SELECT array_agg(r.name) FROM role_user ru JOIN roles r ON r.id = ru.role_id WHERE ru.user_id = u.id) AS roles
      FROM users u WHERE u.email = 'booker-1@e2e.zamaro.test'`);
    const consents = await query(sql`
      SELECT c.kind::text AS kind, c.document_version, c.granted
      FROM consent_records c JOIN users u ON u.id = c.user_id
      WHERE u.email = 'booker-1@e2e.zamaro.test' ORDER BY c.kind::text`);

    expect(user).toMatchObject({ name: 'Booker 1', verified: true, roles: ['booker'] });
    expect(consents).toEqual([
      { kind: 'marketing-email', document_version: null, granted: false },
      { kind: 'privacy-policy', document_version: '2026-10', granted: true },
      { kind: 'terms', document_version: '2026-10', granted: true },
    ]);
  });

  it('--unverified leaves the address waiting for its link, --terms records an older version', async () => {
    await castBooker('booker-3@e2e.zamaro.test', { unverified: true, terms: '2026-03' });

    const [user] = await query(
      sql`SELECT email_verified_at FROM users WHERE email = 'booker-3@e2e.zamaro.test'`,
    );
    const [terms] = await query(sql`
      SELECT c.document_version FROM consent_records c JOIN users u ON u.id = c.user_id
      WHERE u.email = 'booker-3@e2e.zamaro.test' AND c.kind = 'terms'`);

    expect(user?.email_verified_at).toBeNull();
    expect(terms?.document_version).toBe('2026-03');
  });

  it('refuses to run in production', async () => {
    process.env.ZAMARO_ENV = 'production';
    reloadConfig();

    await expect(castBooker('booker-2@e2e.zamaro.test')).rejects.toThrow('production');
    const [user] = await query(sql`SELECT id FROM users WHERE email = 'booker-2@e2e.zamaro.test'`);
    expect(user).toBeUndefined();
  });
});
