import { authenticator } from 'otplib';
import { expect } from 'vitest';
import type { Browser } from './accounts';

/** The 6 digits an authenticator app shows now for the key, as the person's phone would. */
export function currentCode(secret: string): string {
  return authenticator.generate(secret.replace(/\s/g, ''));
}

/** Begins two-step sign-in for the signed-in browser; answers the key without spaces. */
export async function beginTwoFactor(browser: Browser): Promise<string> {
  const response = await browser.json('/api/v1/account/two-factor', 'POST');
  expect(response.status).toBe(200);
  const body = (await response.json()) as { data: { key: string } };
  return body.data.key.replace(/\s/g, '');
}

/** Turns two-step sign-in on for the signed-in browser; answers the key and the recovery codes. */
export async function turnOnTwoFactor(
  browser: Browser,
): Promise<{ secret: string; recoveryCodes: string[] }> {
  const secret = await beginTwoFactor(browser);
  const response = await browser.json('/api/v1/account/two-factor/confirm', 'POST', {
    code: currentCode(secret),
  });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { data: { recoveryCodes: string[] } };
  return { secret, recoveryCodes: body.data.recoveryCodes };
}
