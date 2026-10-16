import { describe, expect, it } from 'vitest';
import { cli } from '../../support/cli';
import { testDb } from '../../support/db';

/**
 * `cast:booker` (M2 plan D19): e2e specs that change data get a fresh booker who can sign in, and
 * production never gets one. Signing in with the cast password is proven with the session slice.
 */
describe('cast:booker', () => {
  it('makes a verified booker who accepted the current terms', async () => {
    const result = cli('cast-booker', ['booker-1@e2e.zamaro.test']);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('booker-1@e2e.zamaro.test');
    const [user] = await testDb()`
      SELECT u.name, u.email_verified_at IS NOT NULL AS verified,
             (SELECT array_agg(r.name) FROM role_user ru JOIN roles r ON r.id = ru.role_id WHERE ru.user_id = u.id) AS roles
      FROM users u WHERE u.email = 'booker-1@e2e.zamaro.test'`;
    const consents = await testDb()`
      SELECT c.kind::text AS kind, c.document_version, c.granted FROM consent_records c JOIN users u ON u.id = c.user_id
      WHERE u.email = 'booker-1@e2e.zamaro.test' ORDER BY c.kind::text`;

    expect(user).toMatchObject({ name: 'Booker 1', verified: true, roles: ['booker'] });
    expect(consents.map((row) => ({ ...row }))).toEqual([
      { kind: 'marketing-email', document_version: null, granted: false },
      { kind: 'privacy-policy', document_version: '2026-10', granted: true },
      { kind: 'terms', document_version: '2026-10', granted: true },
    ]);
  });

  it('--unverified leaves the address waiting for its link, --terms records an older version', async () => {
    const result = cli('cast-booker', [
      'booker-3@e2e.zamaro.test',
      '--unverified',
      '--terms=2026-03',
    ]);

    expect(result.status, result.stderr).toBe(0);
    const [user] =
      await testDb()`SELECT email_verified_at FROM users WHERE email = 'booker-3@e2e.zamaro.test'`;
    const [terms] = await testDb()`
      SELECT c.document_version FROM consent_records c JOIN users u ON u.id = c.user_id
      WHERE u.email = 'booker-3@e2e.zamaro.test' AND c.kind = 'terms'`;

    expect(user?.email_verified_at).toBeNull();
    expect(terms?.document_version).toBe('2026-03');
  });

  it('refuses to run in production', async () => {
    const result = cli('cast-booker', ['booker-2@e2e.zamaro.test'], { ZAMARO_ENV: 'production' });

    expect(result.status).not.toBe(0);
    const [user] = await testDb()`SELECT id FROM users WHERE email = 'booker-2@e2e.zamaro.test'`;
    expect(user).toBeUndefined();
  });
});
