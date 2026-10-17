import { and, desc, eq, lte } from 'drizzle-orm';
import { db } from '@/server/db/client';
import type { Database, Transaction } from '@/server/db/client';
import { consentRecords, legalDocuments } from '@/server/db/schema';
import { ConsentKind } from '@/server/enums';
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

/**
 * Whether the person must accept the current terms first (L2-080.3): their latest granted terms
 * record is not the current version. A new privacy policy alone asks nothing (M2 D15), and with no
 * terms published there is nothing to accept.
 */
export async function termsAcceptanceRequired(
  userId: number,
  database: Database | Transaction = db(),
): Promise<boolean> {
  const current = await currentLegalDocumentOrNull(database, ConsentKind.Terms);
  if (current === null) return false;
  const [accepted] = await database
    .select({ version: consentRecords.documentVersion })
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.userId, userId),
        eq(consentRecords.kind, ConsentKind.Terms),
        eq(consentRecords.granted, true),
      ),
    )
    .orderBy(desc(consentRecords.recordedAt), desc(consentRecords.id))
    .limit(1);
  return accepted?.version !== current.version;
}
