import type { Transaction } from '@/server/db/client';
import { consentRecords } from '@/server/db/schema';
import type { ConsentKind, ConsentSource } from '@/server/enums';
import { now } from '@/server/support/clock';

/** One thing a person agreed to or declined: the kind, the document version (null for marketing) and the answer. */
export interface ConsentItem {
  kind: ConsentKind;
  documentVersion: string | null;
  granted: boolean;
}

/** Where the answer was given from, as the request reports it. */
export interface ConsentEvidence {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Appends one consent record per item, with the time, the address and the browser, as CASL evidence
 * (L2-080, privacy/record-consent). The only writer of `consent_records`; called inside the caller's
 * transaction.
 */
export async function recordConsent(
  tx: Transaction,
  userId: number,
  items: ConsentItem[],
  source: ConsentSource,
  evidence: ConsentEvidence,
): Promise<void> {
  const recordedAt = now().toJSDate();
  for (const item of items) {
    await tx.insert(consentRecords).values({
      userId,
      kind: item.kind,
      documentVersion: item.documentVersion,
      granted: item.granted,
      recordedAt,
      source,
      ipAddress: evidence.ipAddress,
      userAgent: evidence.userAgent === null ? null : evidence.userAgent.slice(0, 512),
    });
  }
}
