import { expect } from 'vitest';
import type { Browser } from './accounts';

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
};
