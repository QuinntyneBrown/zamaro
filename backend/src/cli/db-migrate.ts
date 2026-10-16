import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '@/server/db/client';
import { run } from './run';

// Applies the pending SQL migrations in database/migrations (ADR-0027). Run explicitly; never on startup.
export async function migrateDatabase(): Promise<void> {
  const migrationsFolder = fileURLToPath(new URL('../../database/migrations', import.meta.url));
  await migrate(db(), { migrationsFolder });
}

if (process.argv[1]?.endsWith('db-migrate.ts')) {
  run(async () => {
    await migrateDatabase();
    console.log('migrated');
  });
}
