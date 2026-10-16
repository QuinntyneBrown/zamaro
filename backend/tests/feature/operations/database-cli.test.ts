import { describe, expect, it } from 'vitest';
import { cli } from '../../support/cli';
import { testDb } from '../../support/db';

/**
 * The database scripts the e2e fixtures and CI call (ADR-0027): `db:reset` gives a fresh, migrated,
 * seeded database (the test run starts from one), and `db:migrate` and `db:seed` can run again on it
 * without changing anything (AGENTS.md: seed data is idempotent and safe to re-run).
 */
describe('database scripts', () => {
  it('db:reset leaves the roles and the legal documents in place', async () => {
    const roles = await testDb()`SELECT name FROM roles ORDER BY name`;
    const documents =
      await testDb()`SELECT kind, version FROM legal_documents ORDER BY kind::text, version`;

    expect(roles.map((row) => String(row.name))).toEqual(['admin', 'artist', 'booker']);
    expect(documents.map((row) => `${String(row.kind)} ${String(row.version)}`)).toEqual([
      'privacy-policy 2026-03',
      'privacy-policy 2026-10',
      'terms 2026-03',
      'terms 2026-10',
    ]);
  });

  it('db:migrate on a migrated database applies nothing and succeeds', async () => {
    const [before] =
      await testDb()`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`;

    const result = cli('db-migrate');

    expect(result.status, result.stderr).toBe(0);
    const [after] = await testDb()`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`;
    expect(after?.count).toBe(before?.count);
  });

  it('db:seed can run again without changing the seeded rows', async () => {
    const before =
      await testDb()`SELECT id, kind, version, effective_from, url, summary_of_changes FROM legal_documents ORDER BY id`;

    const result = cli('db-seed');

    expect(result.status, result.stderr).toBe(0);
    const after =
      await testDb()`SELECT id, kind, version, effective_from, url, summary_of_changes FROM legal_documents ORDER BY id`;
    expect(after).toEqual(before);
  });

  it('db:reset refuses to run in production', () => {
    const result = cli('db-reset', [], { ZAMARO_ENV: 'production' });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('production');
  });
});
