import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser } from '../../support/accounts';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const SESSION = { method: 'post', path: '/session' };
const ONE_MEGABYTE = 1_048_576;

/**
 * L2-075.4: a body over 1 MB to a non-upload endpoint is refused with 413. L2-095.1: the API accepts
 * JSON, so any other body is refused with 415 (security/authorise-and-validate-requests,
 * operations/apply-api-conventions).
 */
describe('request validation', () => {
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase({ seed: false });
    browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');
  });

  afterAll(closeDatabase);

  it('gives a body one byte over a megabyte the 413 problem', async () => {
    const response = await postBody(signInBodyOf(ONE_MEGABYTE + 1), 'application/json');

    expect(response.status).toBe(413);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string; status: number };
    expect(body.type).toBe(`${config().problemsBaseUri}/payload-too-large`);
    expect(body.status).toBe(413);
    expectContract(response, SESSION, body);
  });

  it('lets a body of exactly a megabyte reach validation', async () => {
    const response = await postBody(signInBodyOf(ONE_MEGABYTE), 'application/json');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.credentials ?? body.errors.password).toBeDefined();
  });

  it('refuses a body whose declared length is over a megabyte before reading it', async () => {
    const response = await postBody('{}', 'application/json', {
      'Content-Length': String(ONE_MEGABYTE + 1),
    });

    expect(response.status).toBe(413);
  });

  it.each([
    ['plain text', 'text/plain', 'email=naomi.fraser@riversidecc.ca'],
    [
      'a form',
      'application/x-www-form-urlencoded',
      'email=naomi.fraser%40riversidecc.ca&password=x',
    ],
    ['no content type', '', '{"email":"naomi.fraser@riversidecc.ca"}'],
  ])('gives a body that is not json (%s) the 415 problem', async (_label, contentType, body) => {
    const response = await postBody(body, contentType);

    expect(response.status).toBe(415);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const problem = (await response.json()) as { type: string; status: number };
    expect(problem.type).toBe(`${config().problemsBaseUri}/unsupported-media-type`);
    expect(problem.status).toBe(415);
    expectContract(response, SESSION, problem);
  });

  it('treats json with a charset as json', async () => {
    const response = await postBody(
      '{"email":"","password":""}',
      'application/json; charset=utf-8',
    );

    expect(response.status).toBe(422);
  });

  it('needs no content type on a request without a body', async () => {
    // Without a body there is nothing to refuse; the request meets the CSRF check next (ADR-0027's
    // pipeline order), so a guest without a token gets 419 rather than 415.
    const response = await browser.request('/api/v1/session', {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'X-XSRF-TOKEN': '' },
    });

    expect(response.status).not.toBe(415);
    expect(response.status).toBe(419);
  });

  /** A sign-in body padded with a password to exactly this many bytes. */
  function signInBodyOf(bytes: number): string {
    const empty = '{"email":"naomi.fraser@riversidecc.ca","password":""}';
    return empty.replace('"password":""', `"password":"${'a'.repeat(bytes - empty.length)}"`);
  }

  function postBody(
    body: string,
    contentType: string,
    extra: Record<string, string> = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json', ...extra };
    if (contentType !== '') headers['Content-Type'] = contentType;
    return browser.request('/api/v1/session', { method: 'POST', headers, body });
  }
});
