import { expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists, vulnerableSectorChecks } from '@/server/db/schema';
import { storeDocument } from '@/server/services/artist-onboarding/document-vault';
import { Role, VscStatus } from '@/server/enums';
import { grantRoles } from '@/server/services/accounts/roles';
import { CAST_PASSWORD, type Browser } from './accounts';

const RIVERSIDE = {
  name: 'Riverside Community Church',
  streetAddress: '2150 Lakeshore Road',
  city: 'Burlington',
  postalCode: 'L7R 1A3',
  phone: '905-555-0123',
};

export interface Person {
  id: number;
  email: string;
  name: string;
  as: () => Promise<Browser>;
}

export type OwnershipCase = (owner: Person, intruder: Person) => Promise<void>;

/** The answer carries none of the owner's personal values. */
export async function expectHoldsNothingOf(owner: Person, response: Response): Promise<void> {
  const text = await response.clone().text();
  for (const value of [owner.email, owner.name]) {
    expect(text).not.toContain(value);
    expect(text).not.toContain(JSON.stringify(value).slice(1, -1));
  }
}

/*
 * One case per authenticated route (`METHOD /path`), proving that the intruder, another signed-in
 * user, gets nothing of the owner's (L2-074.2, L2-074.3). cross-user-access.test.ts fails for a
 * route with no case, so every new authenticated route ships with its case in the same commit.
 *
 * A route that names a resource asks for the owner's identifier as the intruder and expects the
 * concealing 404. A route with no identifier acts on the caller alone: the intruder's answer holds
 * none of the owner's values, and the owner is unaffected.
 */
export const ROUTE_OWNERSHIP_CASES: Record<string, OwnershipCase> = {
  'GET /me': async (owner, intruder) => {
    const response = await (await intruder.as()).json('/api/v1/me', 'GET');
    expect(response.status).toBe(200);

    await expectHoldsNothingOf(owner, response);
  },

  'DELETE /session': async (owner, intruder) => {
    expect((await (await intruder.as()).json('/api/v1/session', 'DELETE')).status).toBe(204);

    const response = await (await owner.as()).json('/api/v1/me', 'GET');
    expect(response.status).toBe(200);
    expect(((await response.json()) as { data: { email: string } }).data.email).toBe(owner.email);
  },

  'PUT /account/profile': async (owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/profile', 'PUT', {
      name: 'Someone Else',
    });
    expect(response.status).toBe(200);
    await expectHoldsNothingOf(owner, response);

    const me = (await (await (await owner.as()).json('/api/v1/me', 'GET')).json()) as {
      data: { name: string };
    };
    expect(me.data.name).toBe(owner.name);
  },

  'GET /account/church': async (owner, intruder) => {
    expect((await (await owner.as()).json('/api/v1/account/church', 'PUT', RIVERSIDE)).status).toBe(
      200,
    );

    const response = await (await intruder.as()).json('/api/v1/account/church', 'GET');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: null });
  },

  'PUT /account/church': async (owner, intruder) => {
    expect((await (await owner.as()).json('/api/v1/account/church', 'PUT', RIVERSIDE)).status).toBe(
      200,
    );
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/church', 'PUT', {
      ...RIVERSIDE,
      name: 'Another Church',
    });
    expect(response.status).toBe(200);

    const owners = (await (
      await (await owner.as()).json('/api/v1/account/church', 'GET')
    ).json()) as {
      data: { name: string };
    };
    expect(owners.data.name).toBe(RIVERSIDE.name);
  },

  // A booker has no contact-phone route: the intruder gets the unknown-address 404 (L2-074.1).
  'GET /account/contact-phone': async (_owner, intruder) => {
    expect((await (await intruder.as()).json('/api/v1/account/contact-phone', 'GET')).status).toBe(
      404,
    );
  },

  'PUT /account/contact-phone': async (owner, intruder) => {
    await grantRoles(db(), owner.id, [Role.Artist]);
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/contact-phone', 'PUT', {
      contactPhone: '905-555-0100',
    });
    expect(response.status).toBe(404);
  },

  'PUT /account/email': async (owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/email', 'PUT', {
      email: `new-${intruder.email}`,
      currentPassword: CAST_PASSWORD,
    });
    expect(response.status).toBe(202);
    await expectHoldsNothingOf(owner, response);

    const me = (await (await (await owner.as()).json('/api/v1/me', 'GET')).json()) as {
      data: { email: string; pendingEmail: string | null };
    };
    expect(me.data.email).toBe(owner.email);
    expect(me.data.pendingEmail).toBeNull();
  },

  'PUT /account/password': async (owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/password', 'PUT', {
      currentPassword: CAST_PASSWORD,
      password: 'a-song-of-ascents-121',
      passwordConfirmation: 'a-song-of-ascents-121',
    });
    expect(response.status).toBe(204);

    expect((await (await owner.as()).json('/api/v1/me', 'GET')).status).toBe(200);
  },

  'GET /account/sessions': async (owner, intruder) => {
    await owner.as();
    const response = await (await intruder.as()).json('/api/v1/account/sessions', 'GET');
    expect(response.status).toBe(200);
    await expectHoldsNothingOf(owner, response);

    const body = (await response.json()) as { data: { isCurrent: boolean }[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.isCurrent).toBe(true);
  },

  'DELETE /account/sessions/{session}': async (owner, intruder) => {
    const theirs = (await (
      await (await owner.as()).json('/api/v1/account/sessions', 'GET')
    ).json()) as {
      data: { id: string }[];
    };
    const id = theirs.data[0]?.id ?? 'none';

    const response = await (await intruder.as()).json(`/api/v1/account/sessions/${id}`, 'DELETE');

    expect(response.status).toBe(404);
    expect((await (await owner.as()).json('/api/v1/me', 'GET')).status).toBe(200);
  },

  // Two-step sign-in acts on the caller alone: the intruder's key, codes and state never touch the owner's.
  'POST /account/two-factor': async (owner, intruder) => {
    const response = await (await intruder.as()).json('/api/v1/account/two-factor', 'POST');
    expect(response.status).toBe(200);
    await expectHoldsNothingOf(owner, response);

    const me = (await (await (await owner.as()).json('/api/v1/me', 'GET')).json()) as {
      data: { mfaEnabled: boolean };
    };
    expect(me.data.mfaEnabled).toBe(false);
  },

  'GET /account/two-factor/qr': async (owner, intruder) => {
    expect((await (await owner.as()).json('/api/v1/account/two-factor', 'POST')).status).toBe(200);

    const response = await (await intruder.as()).request('/api/v1/account/two-factor/qr');
    expect(response.status).toBe(404);
  },

  'POST /account/two-factor/confirm': async (owner, intruder) => {
    expect((await (await owner.as()).json('/api/v1/account/two-factor', 'POST')).status).toBe(200);

    const response = await (
      await intruder.as()
    ).json('/api/v1/account/two-factor/confirm', 'POST', {
      code: '000000',
    });
    expect(response.status).toBe(422);
  },

  'DELETE /account/two-factor': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/two-factor', 'DELETE', {
      code: '000000',
    });
    expect(response.status).toBe(404);
  },

  'POST /account/two-factor/recovery-codes': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/two-factor/recovery-codes', 'POST', { code: '000000' });
    expect(response.status).toBe(404);
  },

  'POST /account/consents/terms': async (owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/consents/terms', 'POST', {
      termsVersion: '2026-10',
    });
    expect(response.status).toBe(200);
    await expectHoldsNothingOf(owner, response);
  },

  'GET /account/consents/marketing': async (owner, intruder) => {
    expect(
      (
        await (
          await owner.as()
        ).json('/api/v1/account/consents/marketing', 'POST', {
          granted: true,
        })
      ).status,
    ).toBe(200);

    const response = await (await intruder.as()).json('/api/v1/account/consents/marketing', 'GET');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { granted: false } });
  },

  'POST /account/consents/marketing': async (owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/account/consents/marketing', 'POST', {
      granted: true,
    });
    expect(response.status).toBe(200);

    const owners = await (await owner.as()).json('/api/v1/account/consents/marketing', 'GET');
    expect(await owners.json()).toEqual({ data: { granted: false } });
  },

  // Saved artists: the intruder's list, saves and removals never reach the owner's.
  'GET /saved-artists/ids': async (owner, intruder) => {
    const elijah = await artistId('elijah-park');
    expect(
      (await (await owner.as()).json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT')).status,
    ).toBe(200);

    const response = await (await intruder.as()).json('/api/v1/saved-artists/ids', 'GET');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { artistIds: [], count: 0 } });
  },

  'GET /saved-artists': async (owner, intruder) => {
    const elijah = await artistId('elijah-park');
    expect(
      (await (await owner.as()).json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT')).status,
    ).toBe(200);

    const response = await (await intruder.as()).json('/api/v1/saved-artists', 'GET');
    expect(response.status).toBe(200);
    expect(((await response.json()) as { data: { total: number } }).data.total).toBe(0);
  },

  'PUT /saved-artists/{artist}': async (owner, intruder) => {
    const elijah = await artistId('elijah-park');
    const response = await (
      await intruder.as()
    ).json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT');
    expect(response.status).toBe(200);

    const owners = (await (
      await (await owner.as()).json('/api/v1/saved-artists/ids', 'GET')
    ).json()) as {
      data: { count: number };
    };
    expect(owners.data.count).toBe(0);
  },

  'DELETE /saved-artists/{artist}': async (owner, intruder) => {
    const elijah = await artistId('elijah-park');
    expect(
      (await (await owner.as()).json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT')).status,
    ).toBe(200);

    const response = await (
      await intruder.as()
    ).json(`/api/v1/saved-artists/${String(elijah)}`, 'DELETE');
    expect(response.status).toBe(200);

    const owners = (await (
      await (await owner.as()).json('/api/v1/saved-artists/ids', 'GET')
    ).json()) as {
      data: { count: number };
    };
    expect(owners.data.count).toBe(1);
  },

  'PATCH /me/preferences': async (owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/me/preferences', 'PATCH', {
      themePreference: 'dark',
    });
    expect(response.status).toBe(200);
    await expectHoldsNothingOf(owner, response);

    const me = (await (await (await owner.as()).json('/api/v1/me', 'GET')).json()) as {
      data: { themePreference: string | null };
    };
    expect(me.data.themePreference).toBeNull();
  },

  // Admin routes: a signed-in booker gets the same 404 as an unknown address (L2-066.1).
  'GET /admin/overview': async (_owner, intruder) => {
    expect((await (await intruder.as()).json('/api/v1/admin/overview', 'GET')).status).toBe(404);
  },

  'GET /admin/audit-entries': async (_owner, intruder) => {
    expect((await (await intruder.as()).json('/api/v1/admin/audit-entries', 'GET')).status).toBe(
      404,
    );
  },

  'GET /admin/audit-entries/{entry}': async (_owner, intruder) => {
    expect((await (await intruder.as()).json('/api/v1/admin/audit-entries/1', 'GET')).status).toBe(
      404,
    );
  },

  // Artist-only upload routes: a booker gets the unknown-address 404 (L2-074.1).
  'POST /artist/vulnerable-sector-checks': async (_owner, intruder) => {
    const form = new FormData();
    form.set('file', new File(['%PDF-1.4'], 'check.pdf'));
    form.set('issuedOn', '2026-10-05');
    const response = await (
      await intruder.as()
    ).request('/api/v1/artist/vulnerable-sector-checks', {
      method: 'POST',
      body: form,
    });
    expect(response.status).toBe(404);
  },

  'GET /artist/vulnerable-sector-checks/current': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/artist/vulnerable-sector-checks/current', 'GET');
    expect(response.status).toBe(404);
  },

  // A check's document link: the owner and administrators only; everyone else learns nothing (L2-074.2).
  'GET /vulnerable-sector-checks/{check}/document-link': async (owner, intruder) => {
    const stored = await storeDocument(Buffer.from('%PDF-1.4'));
    const [check] = await db()
      .insert(vulnerableSectorChecks)
      .values({
        userId: owner.id,
        issuedOn: '2026-10-05',
        status: VscStatus.Pending,
        storageKey: stored.key,
        wrappedDataKey: stored.wrappedDataKey,
        mimeType: 'application/pdf',
      })
      .returning({ id: vulnerableSectorChecks.id });

    const response = await (
      await intruder.as()
    ).json(`/api/v1/vulnerable-sector-checks/${String(check?.id ?? 0)}/document-link`, 'GET');
    expect(response.status).toBe(404);
  },

  'GET /admin/vulnerable-sector-checks/{check}/document-link': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/admin/vulnerable-sector-checks/1/document-link', 'GET');
    expect(response.status).toBe(404);
  },

  'GET /admin/vulnerable-sector-checks': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/admin/vulnerable-sector-checks', 'GET');
    expect(response.status).toBe(404);
  },

  'POST /admin/vulnerable-sector-checks/{check}/verification': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/admin/vulnerable-sector-checks/1/verification', 'POST');
    expect(response.status).toBe(404);
  },

  // The application queue and review screen: administrators only; a booker learns nothing (L2-066, L2-074).
  'GET /admin/artist-applications': async (_owner, intruder) => {
    expect(
      (await (await intruder.as()).json('/api/v1/admin/artist-applications', 'GET')).status,
    ).toBe(404);
  },

  'GET /admin/artist-applications/{application}': async (_owner, intruder) => {
    expect(
      (await (await intruder.as()).json('/api/v1/admin/artist-applications/1', 'GET')).status,
    ).toBe(404);
  },

  'POST /admin/artist-applications/{application}/approval': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/admin/artist-applications/1/approval', 'POST');
    expect(response.status).toBe(404);
  },

  'POST /admin/artist-applications/{application}/rejection': async (_owner, intruder) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/admin/artist-applications/1/rejection', 'POST', { reason: 'other' });
    expect(response.status).toBe(404);
  },

  'PUT /admin/artist-applications/{application}/references/{reference}/verification': async (
    _owner,
    intruder,
  ) => {
    const response = await (
      await intruder.as()
    ).json('/api/v1/admin/artist-applications/1/references/1/verification', 'PUT', {
      verified: true,
    });
    expect(response.status).toBe(404);
  },

  'GET /admin/artists': async (_owner, intruder) => {
    expect((await (await intruder.as()).json('/api/v1/admin/artists', 'GET')).status).toBe(404);
  },

  'GET /admin/artists/{artist}': async (_owner, intruder) => {
    expect((await (await intruder.as()).json('/api/v1/admin/artists/1', 'GET')).status).toBe(404);
  },
};

async function artistId(slug: string): Promise<number> {
  const [row] = await db().select({ id: artists.id }).from(artists).where(eq(artists.slug, slug));
  return row?.id ?? 0;
}
