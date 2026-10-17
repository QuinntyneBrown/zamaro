import type { SQL } from 'drizzle-orm';
import { db, type Database, type Transaction } from './client';

/**
 * The rows of a raw `sql` query, whichever driver answers: postgres.js returns the rows as the
 * result, PGlite returns `{ rows }`. Queries are tagged templates, so every value is bound (L2-075.2).
 */
export async function rows<T extends Record<string, unknown>>(
  query: SQL,
  database: Database | Transaction = db(),
): Promise<T[]> {
  const result: unknown = await database.execute(query);
  if (Array.isArray(result)) return result as T[];
  return (result as { rows: T[] }).rows;
}
