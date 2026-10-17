import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { consentRecords } from '@/server/db/schema';
import { ConsentKind, ConsentSource } from '@/server/enums';
import { recordConsent, type ConsentEvidence } from './record-consent';

/** The marketing choice (L2-080.4): the latest marketing record is the choice; none means no. */
export async function marketingChoice(userId: number): Promise<boolean> {
  const [latest] = await db()
    .select({ granted: consentRecords.granted })
    .from(consentRecords)
    .where(
      and(eq(consentRecords.userId, userId), eq(consentRecords.kind, ConsentKind.MarketingEmail)),
    )
    .orderBy(desc(consentRecords.recordedAt), desc(consentRecords.id))
    .limit(1);
  return latest?.granted ?? false;
}

/** Appends a record with source `settings`; the earlier ones stay (L2-080.4). */
export async function saveMarketingChoice(
  userId: number,
  granted: boolean,
  evidence: ConsentEvidence,
): Promise<void> {
  await db().transaction((tx) =>
    recordConsent(
      tx,
      userId,
      [{ kind: ConsentKind.MarketingEmail, documentVersion: null, granted }],
      ConsentSource.Settings,
      evidence,
    ),
  );
}
