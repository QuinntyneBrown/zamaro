import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '@config/zamaro';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

let instance: { db: Database; sql: postgres.Sql } | undefined;

/** The application's database, opened on first use with the pool for this process. */
export function db(): Database {
  return connection().db;
}

/** Closes the pool; CLI entry points call it before exiting. */
export async function closeDatabase(): Promise<void> {
  if (instance === undefined) return;
  const { sql } = instance;
  instance = undefined;
  await sql.end({ timeout: 5 });
}

function connection(): { db: Database; sql: postgres.Sql } {
  if (instance === undefined) {
    const sql = postgres(config().databaseUrl, { max: 10, idle_timeout: 30, connect_timeout: 10 });
    instance = { db: drizzle(sql, { schema, casing: 'snake_case' }), sql };
  }
  return instance;
}
