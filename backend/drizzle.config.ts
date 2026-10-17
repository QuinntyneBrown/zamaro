import { defineConfig } from 'drizzle-kit';

// Drizzle Kit (ADR-0027): SQL migrations generated from src/server/db/schema into database/migrations,
// expand–contract only, applied by `npm run db:migrate` and never on startup.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema/index.ts',
  out: './database/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://zamaro:zamaro@localhost:5432/zamaro',
  },
});
