import { expect } from 'vitest';
import { grantAdministrator } from '@/cli/admin-grant';
import { Browser, signedIn } from './accounts';
import { api } from './app';
import { currentCode, turnOnTwoFactor } from './two-factor';

export { PRIYA_EMAIL, PRIYA_TOTP_SECRET } from '../../database/seeders/cast';

/** Makes the account an administrator with two-step sign-in on, signed out; answers the key. */
export async function makeAdministratorWithTwoStep(email: string): Promise<string> {
  await grantAdministrator(email);
  const browser = await signedIn(email);
  const { secret } = await turnOnTwoFactor(browser);
  expect((await browser.json('/api/v1/session', 'DELETE')).status).toBe(204);
  return secret;
}

/** A browser signed in with the password and the code, as an administrator must. */
export async function signInWithCode(
  email: string,
  secret: string,
  address?: string,
): Promise<Browser> {
  const browser = new Browser();
  browser.address = address;
  const pending = await browser.signIn(email);
  expect(pending.status, `${email} password step`).toBe(202);
  const completed = await browser.json('/api/v1/session/two-factor', 'POST', {
    code: currentCode(secret),
  });
  expect(completed.status, `${email} code step`).toBe(200);
  return browser;
}

/** The 404 problem an address that does not exist gets, for comparison. */
export async function unknownAddressProblem(): Promise<Record<string, unknown>> {
  const response = await api('/api/v1/nothing-here');
  return (await response.json()) as Record<string, unknown>;
}

/** The response is the same 404 problem as an unknown address: type, title and detail alike. */
export async function expectConcealed(
  response: Response,
  unknown: Record<string, unknown>,
  who: string,
): Promise<void> {
  expect(response.status, who).toBe(404);
  expect(response.headers.get('content-type'), who).toBe('application/problem+json');
  const body = (await response.json()) as Record<string, unknown>;
  for (const field of ['type', 'title', 'detail']) {
    expect(body[field], `${who}: ${field}`).toBe(unknown[field]);
  }
}
