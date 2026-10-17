import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { ConsentKind, ConsentSource, Role } from '@/server/enums';
import { sendDuplicateSignUp } from '@/server/notifications/accounts/duplicate-sign-up';
import { sendVerifyEmail } from '@/server/notifications/accounts/verify-email';
import { grantRoles } from '@/server/services/accounts/roles';
import { assertCurrentVersions } from '@/server/services/privacy/legal-document-registry';
import { now } from '@/server/support/clock';
import { hashPassword } from '@/server/support/passwords';
import { returnUrlOrDiscover } from '@/server/support/return-url';
import { recordConsent, type ConsentEvidence } from '../privacy/record-consent';
import { issueEmailVerificationToken } from './issue-email-verification-token';

export interface Registration {
  name: string;
  email: string;
  password: string;
  marketingOptIn: boolean;
  termsVersion: string;
  privacyPolicyVersion: string;
  returnUrl?: string | null | undefined;
}

/**
 * Turns a guest into a booker (L2-022.1): the account, its three consent records (L2-080) and a
 * verification email, in one transaction. An address that already has an account changes nothing
 * and its owner is emailed instead (L2-022.2); both return the same address, so the answer never
 * says which happened. The guest is not signed in. Emails go once the transaction has committed, so
 * none describes a rolled-back change.
 *
 * @returns the address, as written
 * @throws HttpProblem LegalDocumentOutdated when the versions shown are no longer current
 */
export async function registerBooker(
  data: Registration,
  evidence: ConsentEvidence,
): Promise<string> {
  const email = data.email.trim().toLowerCase();
  const hashed = await hashPassword(data.password);

  const send = await db().transaction(async (tx) => {
    await assertCurrentVersions(tx, data.termsVersion, data.privacyPolicyVersion);

    const [owner] = await tx
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .for('update');
    if (owner !== undefined) {
      return () => sendDuplicateSignUp({ name: owner.name, email: owner.email }, now());
    }

    const [created] = await tx
      .insert(users)
      .values({ name: data.name.trim(), email, password: hashed })
      .returning({ id: users.id });
    const userId = created?.id ?? 0;
    await grantRoles(tx, userId, [Role.Booker]);
    await recordConsent(
      tx,
      userId,
      [
        { kind: ConsentKind.Terms, documentVersion: data.termsVersion, granted: true },
        {
          kind: ConsentKind.PrivacyPolicy,
          documentVersion: data.privacyPolicyVersion,
          granted: true,
        },
        { kind: ConsentKind.MarketingEmail, documentVersion: null, granted: data.marketingOptIn },
      ],
      ConsentSource.Registration,
      evidence,
    );
    const token = await issueEmailVerificationToken(tx, userId);
    return () =>
      sendVerifyEmail(
        { name: data.name.trim(), email },
        token,
        returnUrlOrDiscover(data.returnUrl),
      );
  });

  await send();
  return email;
}
