import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { PUBLIC_ROUTES } from '@/app/api/v1/public';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { Role } from '@/server/enums';
import { operations } from '@/server/http/openapi/operations';
import { grantRoles } from '@/server/services/accounts/roles';
import { hashPassword } from '@/server/support/passwords';
import { Browser, CAST_PASSWORD } from '../../support/accounts';
import { closeDatabase, freshDatabase } from '../../support/database';
import { ROUTE_OWNERSHIP_CASES, type Person } from '../../support/route-ownership-fixtures';

/**
 * L2-074: every authenticated route checks role and ownership on the server. A booker on an
 * artist-only or admin-only route, and anyone asking for another user's resource, gets the same 404 as
 * an address that does not exist (security/authorise-and-validate-requests).
 */
describe('cross-user access', () => {
  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase({ seed: false });
  });

  // One case per authenticated route, each with two fresh people: the loop grows with the API.
  it(
    "refuses another user's resource on every authenticated route",
    { timeout: 180_000 },
    async () => {
      const routes = operations
        .filter((operation) => !PUBLIC_ROUTES.has(operation.name))
        .map((operation) => `${operation.method.toUpperCase()} ${operation.path}`);
      expect(routes.length).toBeGreaterThan(0);

      for (const route of routes) {
        const ownershipCase = ROUTE_OWNERSHIP_CASES[route];
        expect(
          ownershipCase,
          `${route} needs a case in route-ownership-fixtures.ts (L2-074.3).`,
        ).toBeDefined();
        await ownershipCase?.(await booker(), await booker());
      }
    },
  );

  it('gives a booker on an artist-only route the same 404 as an unknown address', async () => {
    const browser = await (await booker()).as();

    const response = await browser.json('/api/v1/test-artist-only', 'GET');

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.type).toBe(`${config().problemsBaseUri}/not-found`);
    expect(body).not.toHaveProperty('secret');
    const unknown = (await (await browser.json('/api/v1/nothing-here', 'GET')).json()) as Record<
      string,
      unknown
    >;
    expect(body.detail).toBe(unknown.detail);
    expect(body.title).toBe(unknown.title);
  });

  it('lets an artist through an artist-only route', async () => {
    const artist = await booker();
    await grantRoles(db(), artist.id, [Role.Artist]);

    expect((await (await artist.as()).json('/api/v1/test-artist-only', 'GET')).status).toBe(200);
  });

  it('gives a booker on an admin-only route 404', async () => {
    const response = await (
      await booker()
    )
      .as()
      .then((b) => b.json('/api/v1/test-admin-only', 'GET'));

    expect(response.status).toBe(404);
  });
});

let people = 0;
let castHash: Promise<string> | undefined;

/** A signed-up booker of their own, who signs in from a browser holding no one else's cookie. */
async function booker(): Promise<Person> {
  people++;
  const email = `person-${String(people)}-${String(Math.random()).slice(2, 8)}@example.test`;
  const name = `Person ${String(people)}`;
  const [row] = await db()
    .insert(users)
    .values({
      name,
      email,
      password: await (castHash ??= hashPassword(CAST_PASSWORD)),
      emailVerifiedAt: new Date(),
    })
    .returning({ id: users.id });
  const id = row?.id ?? 0;
  await grantRoles(db(), id, [Role.Booker]);
  let browser: Browser | undefined;
  return {
    id,
    email,
    name,
    as: async () => {
      if (browser === undefined) {
        browser = new Browser();
        const response = await browser.signIn(email);
        expect(response.status, `${email} signs in`).toBe(200);
      }
      return browser;
    },
  };
}
