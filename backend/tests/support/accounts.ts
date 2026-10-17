import { api } from './app';
import { castBooker } from '@/cli/cast-booker';

/** Where Zamaro Web runs in tests; only its origin gets a session (ADR-0015). */
export const WEB_ORIGIN = 'http://localhost:4200';
export const CAST_PASSWORD = 'hosanna-in-the-highest';
export const NAOMI = 'naomi.fraser@riversidecc.ca';
export const ABIGAIL = 'abigail@abigailmensah.ca';
export const TOMI = 'tomi.oduya@harvestpointchurch.ca';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * A browser on Zamaro Web: it sends the web origin as the Referer, keeps the cookies each answer
 * sets, and repeats the XSRF-TOKEN cookie in X-XSRF-TOKEN on every state-changing request, as
 * Angular's interceptor does.
 */
export class Browser {
  readonly cookies = new Map<string, string>();
  /** The address the request comes from, as the trusted proxy reports it. */
  address: string | undefined;
  /** The browser's user agent, for the signed-in devices list. */
  userAgent: string | undefined;

  cookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    headers.set('Referer', `${WEB_ORIGIN}/`);
    if (this.address !== undefined) headers.set('X-Forwarded-For', this.address);
    if (this.userAgent !== undefined) headers.set('User-Agent', this.userAgent);
    const cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    if (cookie !== '') headers.set('Cookie', cookie);
    const token = this.cookies.get('XSRF-TOKEN');
    if (MUTATING.has(method) && token !== undefined && !headers.has('X-XSRF-TOKEN')) {
      headers.set('X-XSRF-TOKEN', token);
    }
    const response = await api(path, { ...init, method, headers });
    this.keep(response);
    return response;
  }

  json(path: string, method: string, body?: unknown): Promise<Response> {
    return this.request(path, {
      method,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  }

  /** Signs in through the API as the sign-in page does, after fetching the CSRF cookie. */
  async signIn(email: string, password: string = CAST_PASSWORD): Promise<Response> {
    await this.request('/api/v1/csrf-cookie');
    return this.json('/api/v1/session', 'POST', { email, password });
  }

  /** The cookies an answer sets replace the ones held; a cleared cookie is forgotten. */
  keep(response: Response): void {
    for (const header of response.headers.getSetCookie()) {
      const [pair, ...attributes] = header.split(';');
      const separator = pair?.indexOf('=') ?? -1;
      if (pair === undefined || separator < 0) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const cleared = attributes.some((attribute) => /^\s*max-age=0$/i.test(attribute));
      if (cleared || value === '') this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
}

/** A browser signed in as `email`; the sign-in answer is checked to be 200. */
export async function signedIn(email: string, password: string = CAST_PASSWORD): Promise<Browser> {
  const browser = new Browser();
  const response = await browser.signIn(email, password);
  if (response.status !== 200) {
    throw new Error(`sign-in answered ${String(response.status)}: ${await response.text()}`);
  }
  return browser;
}

let freshBookers = 0;

/** A verified booker of their own (cast:booker), so the seeded cast stays as the mocks show it. */
export async function freshBooker(): Promise<string> {
  freshBookers++;
  const email = `fresh-${String(freshBookers)}-${String(Math.random()).slice(2, 8)}@example.ca`;
  await castBooker(email);
  return email;
}
