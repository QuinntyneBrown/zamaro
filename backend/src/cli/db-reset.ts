import { sql } from 'drizzle-orm';
import { config } from '@config/zamaro';
import { db, migrateDatabase } from '@/server/db/client';
import { seedDatabase } from './db-seed';
import { run } from './run';

// Drops everything, migrates and seeds: the e2e and test databases start from here (ADR-0027).
// Never in production, where migrations are expand–contract and data is kept.
export async function resetDatabase(): Promise<void> {
  if (config().env === 'production') {
    throw new Error('db:reset never runs in production.');
  }
  await db().execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db().execute(sql`DROP SCHEMA public CASCADE`);
  await db().execute(sql`CREATE SCHEMA public`);
  await migrateDatabase();
  await seedDatabase();
}

if (process.argv[1]?.endsWith('db-reset.ts')) {
  run(async () => {
    await resetDatabase();
    console.log('reset');
  });
}
