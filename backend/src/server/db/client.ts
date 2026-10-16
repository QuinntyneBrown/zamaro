import { resolve } from 'node:path';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from '@config/zamaro';
import * as schema from './schema';

export type Schema = typeof schema;
export type Database = PgDatabase<PgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;
export type Transaction = PgTransaction<
  PgQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

/** A database behind the application: postgres.js in the application, PGlite in tests (ADR-0028). */
export interface DatabaseProvider {
  db: Database;
  /** Applies the pending SQL migrations in database/migrations with this driver's migrator. */
  migrate: () => Promise<void>;
  close: () => Promise<void>;
}

/** Resolved from the working directory: the CLI, the tests and the API all run from backend/. */
export const MIGRATIONS_FOLDER = resolve(process.cwd(), 'database/migrations');

let provider: DatabaseProvider | undefined;

/** The application's database, opened on first use with the pool for this process. */
export function db(): Database {
  provider ??= postgresProvider();
  return provider.db;
}

/** Binds another provider (tests bind PGlite); `undefined` returns to the configured database. */
export function useDatabase(next: DatabaseProvider | undefined): void {
  provider = next;
}

export async function migrateDatabase(): Promise<void> {
  provider ??= postgresProvider();
  await provider.migrate();
}

/** Closes the pool; CLI entry points call it before exiting. */
export async function closeDatabase(): Promise<void> {
  if (provider === undefined) return;
  const current = provider;
  provider = undefined;
  await current.close();
}

function postgresProvider(): DatabaseProvider {
  const sql = postgres(config().databaseUrl, { max: 10, idle_timeout: 30, connect_timeout: 10 });
  const database = drizzle(sql, { schema, casing: 'snake_case' });
  return {
    db: database,
    migrate: () => migrate(database, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: () => sql.end({ timeout: 5 }),
  };
}
