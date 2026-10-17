import { db } from '@/server/db/client';
import { ConsentKind, ConsentSource } from '@/server/enums';
import { currentLegalDocument } from '@/server/services/privacy/legal-document-registry';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { recordConsent, type ConsentEvidence } from './record-consent';

/**
 * Accepting the current terms (L2-080.3): the version the page showed must still be current, so
 * the record holds the version the person saw; otherwise 409 `legal-document-outdated` and nothing
 * is written. Recorded with source `terms-update`.
 */
export async function acceptCurrentTerms(
  userId: number,
  termsVersion: string,
  evidence: ConsentEvidence,
): Promise<void> {
  const current = await currentLegalDocument(db(), ConsentKind.Terms);
  if (current.version !== termsVersion) {
    throw new HttpProblem(ProblemType.LegalDocumentOutdated, {
      detail: 'The terms changed since the page was shown.',
    });
  }
  await db().transaction((tx) =>
    recordConsent(
      tx,
      userId,
      [{ kind: ConsentKind.Terms, documentVersion: termsVersion, granted: true }],
      ConsentSource.TermsUpdate,
      evidence,
    ),
  );
}
