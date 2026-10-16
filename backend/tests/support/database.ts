import { PGlite } from '@electric-sql/pglite';
import type { SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { seedDatabase } from '@/cli/db-seed';
import { closeDatabase, MIGRATIONS_FOLDER, useDatabase, type Database } from '@/server/db/client';
import { rows } from '@/server/db/raw';
import * as schema from '@/server/db/schema';

/**
 * A fresh in-memory Postgres (PGlite, ADR-0028) migrated with the real migrations and, unless told
 * otherwise, seeded with the cast. Bound as the application's database until `closeDatabase()`.
 */
export async function freshDatabase({ seed = true }: { seed?: boolean } = {}): Promise<Database> {
  const client = new PGlite();
  const database = drizzle(client, { schema, casing: 'snake_case' });
  useDatabase({
    db: database,
    migrate: () => migrate(database, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: () => client.close(),
  });
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
  if (seed) await seedDatabase();
  return database;
}

/** The rows of a raw query against the test database; the template binds every value. */
export function query<T extends Record<string, unknown>>(sql: SQL): Promise<T[]> {
  return rows<T>(sql);
}

export { closeDatabase };
