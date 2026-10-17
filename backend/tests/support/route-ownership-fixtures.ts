import { expect } from 'vitest';
import { db } from '@/server/db/client';
import { Role } from '@/server/enums';
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
};
