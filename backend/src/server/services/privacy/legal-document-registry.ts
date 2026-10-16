import { and, desc, eq, lte } from 'drizzle-orm';
import type { Database, Transaction } from '@/server/db/client';
import { legalDocuments } from '@/server/db/schema';
import type { ConsentKind } from '@/server/enums';
import { today } from '@/server/support/clock';

export type LegalDocument = typeof legalDocuments.$inferSelect;

/**
 * The current version of each legal document: the latest whose effective date has come
 * (privacy/record-consent). Read on demand rather than cached, so a newly effective version applies
 * at once.
 */
export async function currentLegalDocumentOrNull(
  db: Database | Transaction,
  kind: ConsentKind,
): Promise<LegalDocument | null> {
  const [document] = await db
    .select()
    .from(legalDocuments)
    .where(and(eq(legalDocuments.kind, kind), lte(legalDocuments.effectiveFrom, today())))
    .orderBy(desc(legalDocuments.effectiveFrom))
    .limit(1);
  return document ?? null;
}
