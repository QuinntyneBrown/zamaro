import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';
import type { SessionData } from '@/server/contracts/session-store';
import { sessionStore } from '@/server/integrations/bindings';
import { now } from '@/server/support/clock';

/**
 * Same-origin cookie sessions (ADR-0015, ADR-0027): a request from one of Zamaro Web's origins
 * carries the `zamaro_session` cookie (HttpOnly, Secure, SameSite=Lax) naming its session in the
 * store, and reads the CSRF token from the `XSRF-TOKEN` cookie to repeat it in X-XSRF-TOKEN.
 * Every other caller is stateless.
 */
export const SESSION_COOKIE = 'zamaro_session';
export const XSRF_COOKIE = 'XSRF-TOKEN';
export const XSRF_HEADER = 'x-xsrf-token';

export class Session {
  private regenerated = false;

  constructor(
    public id: string,
    public data: SessionData,
    /** No session in the store answered the cookie: a guest session started for this request. */
    readonly isNew: boolean,
  ) {}

  get userId(): number | undefined {
    return this.data.userId;
  }

  /** A new ID, so one known before sign-in is useless after it (session fixation, L2-073.1). */
  async regenerate(): Promise<void> {
    if (!this.isNew && !this.regenerated) await sessionStore().destroy(this.id);
    this.id = newId();
    this.regenerated = true;
  }

  regenerateToken(): void {
    this.data.csrfToken = newId();
  }

  /** Forgets everything and starts a fresh guest session under a new ID. */
  async invalidate(): Promise<void> {
    await this.regenerate();
    this.data = { csrfToken: newId() };
  }

  tokenMatches(candidate: string | null): boolean {
    if (candidate === null) return false;
    const expected = Buffer.from(this.data.csrfToken);
    const given = Buffer.from(candidate);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  /** Writes the session back with its idle expiry refreshed. */
  async save(): Promise<void> {
    await sessionStore().write(this.id, this.data, idleSeconds());
  }
}

/** A request from Zamaro Web's origin gets a session; any other caller stays stateless (ADR-0015). */
export function isStateful(request: NextRequest): boolean {
  const origins = config().webOrigins;
  for (const header of ['origin', 'referer']) {
    const value = request.headers.get(header);
    if (value === null) continue;
    try {
      if (origins.includes(new URL(value).origin)) return true;
    } catch {
      // Not a URL: not one of ours.
    }
  }
  return false;
}

/** The request's session from the cookie, or a new guest session when none answers. */
export async function loadSession(request: NextRequest): Promise<Session> {
  const id = request.cookies.get(SESSION_COOKIE)?.value;
  if (id !== undefined && /^[a-f0-9]{40}$/.test(id)) {
    const data = await sessionStore().read(id);
    if (data !== null) return new Session(id, data, false);
  }
  return new Session(newId(), { csrfToken: newId() }, true);
}

/** Sets the session and CSRF cookies on an answer, with the idle limit as their lifetime. */
export function withSessionCookies(response: Response, session: Session): Response {
  const headers = new Headers(response.headers);
  const secure = config().secureCookies ? '; Secure' : '';
  const maxAge = `; Max-Age=${String(idleSeconds())}`;
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${session.id}; Path=/; HttpOnly${secure}; SameSite=Lax${maxAge}`,
  );
  headers.append(
    'Set-Cookie',
    `${XSRF_COOKIE}=${session.data.csrfToken}; Path=/${secure}; SameSite=Lax${maxAge}`,
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function idleSeconds(): number {
  return config().sessionLifetimeMinutes * 60;
}

/** The 30-day absolute limit (L2-073.3): whether a session that started at `startedAt` has reached it. */
export const ABSOLUTE_MINUTES = 43200;

export function absoluteLimitReached(startedAt: number | undefined): boolean {
  // A session with no start time predates the rule; it is ended rather than trusted.
  return startedAt === undefined || now().toSeconds() - startedAt >= ABSOLUTE_MINUTES * 60;
}

function newId(): string {
  return randomBytes(20).toString('hex');
}
