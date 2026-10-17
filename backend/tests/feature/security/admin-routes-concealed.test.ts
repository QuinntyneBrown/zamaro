import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { operations } from '@/server/http/openapi/operations';
import { ABIGAIL, Browser, freshBooker, NAOMI, signedIn } from '../../support/accounts';
import {
  expectConcealed,
  makeAdministratorWithTwoStep,
  unknownAddressProblem,
} from '../../support/admin';
import { resetClock } from '../../support/clock';
import { closeDatabase, freshDatabase } from '../../support/database';

/**
 * L2-066.1, L2-074.1 (administration/secure-admin-access): every admin API route, with any ID, gives
 * a guest, a booker, an artist and an administrator who has only given their password the same 404
 * as an address that does not exist, so nothing reveals that the route or the record exists.
 */
describe('admin routes are concealed', () => {
  beforeAll(async () => {
    await freshDatabase();
    resetClock();
  });

  afterAll(closeDatabase);

  it(
    'answers not found on every admin route to anyone but a fully signed-in administrator',
    { timeout: 120_000 },
    async () => {
      const routes = operations
        .filter((operation) => operation.name.startsWith('admin.'))
        .map((operation) => ({
          method: operation.method.toUpperCase(),
          path: `/api/v1${operation.path.replace(/\{[^}]+\}/g, '1')}`,
        }));
      expect(routes.length).toBeGreaterThan(0);
      const guest = new Browser();
      await guest.request('/api/v1/csrf-cookie');
      const callers: [string, Browser][] = [
        ['a guest', guest],
        ['a booker', await signedIn(NAOMI)],
        ['an artist', await signedIn(ABIGAIL)],
        ['an administrator after the password alone', await administratorAfterThePassword()],
      ];
      const unknown = await unknownAddressProblem();

      for (const { method, path } of routes) {
        for (const [caller, browser] of callers) {
          const response = await browser.json(path, method, method === 'GET' ? undefined : {});

          await expectConcealed(response, unknown, `${method} ${path} as ${caller}`);
        }
      }
    },
  );

  /** An administrator with two-step sign-in on, who has given the right password but no code yet. */
  async function administratorAfterThePassword(): Promise<Browser> {
    const email = await freshBooker();
    await makeAdministratorWithTwoStep(email);
    const browser = new Browser();
    expect((await browser.signIn(email)).status).toBe(202);
    return browser;
  }
});
