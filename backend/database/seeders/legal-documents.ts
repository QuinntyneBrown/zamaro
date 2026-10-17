import { sql } from 'drizzle-orm';
import type { Database } from '@/server/db/client';
import { legalDocuments } from '@/server/db/schema';
import { ConsentKind } from '@/server/enums';

/**
 * The published terms and privacy policy (M2 plan, seed data). Terms 2026-10 took effect on
 * Thu 8 Oct 2026 with the three changes the accept-terms mock lists; Tomi last accepted 2026-03.
 * Each terms version has a privacy policy of the same date, so a version is current on every day.
 * Upserted on kind and version, so running it again changes nothing.
 */
const DOCUMENTS: (typeof legalDocuments.$inferInsert)[] = [
  {
    kind: ConsentKind.Terms,
    version: '2026-03',
    effectiveFrom: '2026-03-01',
    url: 'https://zamaro.ca/legal/terms',
    summaryOfChanges: [],
  },
  {
    kind: ConsentKind.Terms,
    version: '2026-10',
    effectiveFrom: '2026-10-08',
    url: 'https://zamaro.ca/legal/terms',
    summaryOfChanges: [
      'How long booking and payment records are kept after an account is deleted: 7 years, for tax, without your name.',
      'Which payment processor holds card details; Zamaro never sees or stores them.',
      'How Zamaro checks artists who lead youth events.',
    ],
  },
  {
    kind: ConsentKind.PrivacyPolicy,
    version: '2026-03',
    effectiveFrom: '2026-03-01',
    url: 'https://zamaro.ca/legal/privacy',
    summaryOfChanges: [],
  },
  {
    kind: ConsentKind.PrivacyPolicy,
    version: '2026-10',
    effectiveFrom: '2026-10-08',
    url: 'https://zamaro.ca/legal/privacy',
    summaryOfChanges: [],
  },
];

export async function seedLegalDocuments(db: Database): Promise<void> {
  await db
    .insert(legalDocuments)
    .values(DOCUMENTS)
    .onConflictDoUpdate({
      target: [legalDocuments.kind, legalDocuments.version],
      set: {
        effectiveFrom: sql`excluded.effective_from`,
        url: sql`excluded.url`,
        summaryOfChanges: sql`excluded.summary_of_changes`,
        updatedAt: sql`now()`,
      },
    });
}
