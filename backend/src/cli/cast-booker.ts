import { parseArgs } from 'node:util';
import { config } from '@config/zamaro';
import { db } from '@/server/db/client';
import { consentRecords, users } from '@/server/db/schema';
import { ConsentKind, ConsentSource, Role } from '@/server/enums';
import { grantRoles } from '@/server/services/accounts/roles';
import { currentLegalDocumentOrNull } from '@/server/services/privacy/legal-document-registry';
import { now } from '@/server/support/clock';
import { hashPassword } from '@/server/support/passwords';
import { headline } from '@/server/support/strings';
import { run } from './run';

/**
 * `npm run cast:booker -- <email> [--unverified] [--terms=2026-03]`: a fresh booker for e2e specs
 * that change data (M2 plan D19), so the seeded cast stays as the mocks show it. They sign in with
 * ZAMARO_CAST_PASSWORD, so this never runs in production.
 */
export async function castBooker(
  email: string,
  options: { unverified?: boolean; terms?: string } = {},
): Promise<void> {
  const password = config().castPassword;
  if (config().env === 'production' || password === undefined) {
    throw new Error('cast:booker runs only in local, test and e2e, with ZAMARO_CAST_PASSWORD set.');
  }
  const address = email.trim().toLowerCase();
  await db().transaction(async (tx) => {
    const values = {
      name: headline(address.slice(0, address.indexOf('@'))),
      password: await hashPassword(password),
      emailVerifiedAt: options.unverified ? null : now().toJSDate(),
    };
    const [user] = await tx
      .insert(users)
      .values({ email: address, ...values })
      .onConflictDoUpdate({ target: users.email, set: { ...values, updatedAt: now().toJSDate() } })
      .returning({ id: users.id });
    if (user === undefined) throw new Error('The booker could not be saved.');
    await grantRoles(tx, user.id, [Role.Booker]);

    // The terms and privacy policy a registration records (L2-080.1), at --terms or the current version.
    const version =
      options.terms ?? (await currentLegalDocumentOrNull(tx, ConsentKind.Terms))?.version;
    if (version === undefined) return;
    const recordedAt = now().toJSDate();
    await tx.insert(consentRecords).values([
      {
        userId: user.id,
        kind: ConsentKind.Terms,
        documentVersion: version,
        granted: true,
        recordedAt,
        source: ConsentSource.Registration,
      },
      {
        userId: user.id,
        kind: ConsentKind.PrivacyPolicy,
        documentVersion: version,
        granted: true,
        recordedAt,
        source: ConsentSource.Registration,
      },
      {
        userId: user.id,
        kind: ConsentKind.MarketingEmail,
        documentVersion: null,
        granted: false,
        recordedAt,
        source: ConsentSource.Registration,
      },
    ]);
  });
  console.log(address);
}

if (process.argv[1]?.endsWith('cast-booker.ts')) {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: { unverified: { type: 'boolean' }, terms: { type: 'string' } },
    allowPositionals: true,
  });
  const [email] = positionals;
  run(async () => {
    if (email === undefined)
      throw new Error('Usage: cast:booker <email> [--unverified] [--terms=YYYY-MM]');
    await castBooker(email, {
      ...(values.unverified !== undefined && { unverified: values.unverified }),
      ...(values.terms !== undefined && { terms: values.terms }),
    });
  });
}
