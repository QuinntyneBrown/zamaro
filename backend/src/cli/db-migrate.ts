import { migrateDatabase } from '@/server/db/client';
import { run } from './run';

// Applies the pending SQL migrations in database/migrations (ADR-0027). Run explicitly; never on startup.
if (process.argv[1]?.endsWith('db-migrate.ts')) {
  run(async () => {
    await migrateDatabase();
    console.log('migrated');
  });
}
