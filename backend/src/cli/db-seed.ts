import { seedCast } from '../../database/seeders/cast';
import { seedLegalDocuments } from '../../database/seeders/legal-documents';
import { seedMedia } from '../../database/seeders/media';
import { db } from '@/server/db/client';
import { run } from './run';

// Seeds the database (ADR-0027). Idempotent: safe to run again on a seeded database (AGENTS.md).
export async function seedDatabase(): Promise<void> {
  await seedLegalDocuments(db());
  await seedCast(db());
  await seedMedia();
}

if (process.argv[1]?.endsWith('db-seed.ts')) {
  run(async () => {
    await seedDatabase();
    console.log('seeded');
  });
}
