import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { AuditAction, AuditOutcome, Role } from '@/server/enums';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { signedUrl } from '@/server/support/signed-url';
import { recordAuditEntry } from '../audit/record-audit-entry';

/** A signed link lasts this long (L2-076.3). */
export const LINK_MINUTES = 5;

export interface DocumentLink {
  url: string;
  expiresAt: string;
}

/**
 * A link to a check's document (verify-vulnerable-sector-check, L2-049.4): for the check's owner and
 * administrators, a URL on the media host that works for 5 minutes and streams the document as a
 * download. Anyone else, an unknown check and a check with no document yet get the same 404, so
 * nothing says the check exists (L2-074.2). An administrator opening a document is audited (L2-069).
 */
export async function documentLinkFor(
  checkId: number,
  user: CurrentUser,
  request: NextRequest,
): Promise<DocumentLink> {
  const [check] = await db()
    .select({
      id: vulnerableSectorChecks.id,
      userId: vulnerableSectorChecks.userId,
      storageKey: vulnerableSectorChecks.storageKey,
    })
    .from(vulnerableSectorChecks)
    .where(eq(vulnerableSectorChecks.id, checkId));
  const isOwner = check?.userId === user.id;
  const isAdministrator = user.roles.includes(Role.Administrator);
  if (check === undefined || check.storageKey === null || (!isOwner && !isAdministrator)) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  if (!isOwner) {
    await recordAuditEntry({
      actor: user,
      action: AuditAction.VscDocumentViewed,
      target: { type: 'vulnerable_sector_check', id: check.id },
      outcome: AuditOutcome.Succeeded,
      request,
    });
  }
  const expiresAt = now().plus({ minutes: LINK_MINUTES });
  return {
    url: signedUrl(
      config().mediaOrigin,
      `/documents/${check.storageKey}`,
      Math.floor(expiresAt.toSeconds()),
    ),
    expiresAt: expiresAt.toISO() ?? '',
  };
}
