import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { reloadConfig } from '@config/zamaro';
import { resetDatabase } from '@/cli/db-reset';
import { seedDatabase } from '@/cli/db-seed';
import { migrateDatabase } from '@/server/db/client';
import { closeDatabase, freshDatabase, query } from '../../support/database';

/**
 * The database scripts the e2e fixtures and CI call (ADR-0027): `db:reset` gives a fresh, migrated,
 * seeded database, and `db:migrate` and `db:seed` can run again on it without changing anything
 * (AGENTS.md: seed data is idempotent and safe to re-run).
 */
describe('database scripts', () => {
  beforeAll(async () => {
    await freshDatabase({ seed: false });
    await resetDatabase();
  });

  afterAll(closeDatabase);

  afterEach(() => {
    process.env.ZAMARO_ENV = 'test';
    reloadConfig();
  });

  it('db:reset leaves the roles and the legal documents in place', async () => {
    const roles = await query(sql`SELECT name FROM roles ORDER BY name`);
    const documents = await query(
      sql`SELECT kind, version FROM legal_documents ORDER BY kind::text, version`,
    );

    expect(roles.map((row) => String(row.name))).toEqual(['admin', 'artist', 'booker']);
    expect(documents.map((row) => `${String(row.kind)} ${String(row.version)}`)).toEqual([
      'privacy-policy 2026-03',
      'privacy-policy 2026-10',
      'terms 2026-03',
      'terms 2026-10',
    ]);
  });

  it('db:migrate on a migrated database applies nothing and succeeds', async () => {
    const [before] = await query(
      sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`,
    );

    await migrateDatabase();

    const [after] = await query(
      sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`,
    );
    expect(after?.count).toBe(before?.count);
  });

  it('db:seed can run again without changing the seeded rows', async () => {
    const documents = () =>
      query(
        sql`SELECT id, kind, version, effective_from, url, summary_of_changes FROM legal_documents ORDER BY id`,
      );
    const before = await documents();

    await seedDatabase();

    expect(await documents()).toEqual(before);
  });

  it('db:reset refuses to run in production', async () => {
    process.env.ZAMARO_ENV = 'production';
    reloadConfig();

    await expect(resetDatabase()).rejects.toThrow('production');
    const [users] = await query(sql`SELECT count(*)::int AS count FROM users`);
    expect(users?.count).toBeGreaterThan(0);
  });
});
