import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';
import { PUBLIC_ROUTES } from '@/app/api/v1/public';
import { Role } from '@/server/enums';
import { loadCurrentUser, type CurrentUser } from '@/server/services/accounts/current-user';
import { forgetSession, touchSession } from '@/server/services/accounts/session-registry';
import {
  adminIdledOut,
  isMfaVerified,
  touchAdminActivity,
} from '@/server/services/administration/admin-session';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { logger } from '../support/logger';
import {
  HttpProblem,
  HttpRedirect,
  httpError,
  problemResponse,
  ProblemType,
} from '../support/problems';
import { runWithRequestContext } from '../support/request-context';
import { gateBody, JSON_BODY_RULE } from './body-gate';
import { enforceRateLimit, type RateLimitName } from './rate-limits';
import {
  absoluteLimitReached,
  isStateful,
  loadSession,
  withSessionCookies,
  XSRF_HEADER,
  type Session,
} from './session';

/**
 * The request pipeline (ADR-0027): the one place that fixes what happens around every route handler.
 * Order: request ID → request logging → problem-details error handling → session → CSRF → the
 * body gate → the API rate limit → authentication → roles → the terms gate → the route's own rate
 * limit → the handler → CORS and cookies. Logging wraps error handling, so handled statuses are logged (AGENTS.md).
 */

export interface RouteContext {
  params: Promise<Record<string, string | string[] | undefined>>;
}
export type Handler = (request: NextRequest, context: RouteContext) => Promise<Response> | Response;

export interface RouteOptions {
  /** The route's name in the request log and in src/app/api/v1/public.ts, e.g. `health.live`. */
  name: string;
  /** A method's own name where one file serves routes with different names (`session.destroy`). */
  names?: Partial<Record<Exclude<Method, 'OPTIONS'>, string>>;
  /** The named rate limit the route is behind (L2-077); over it, a 429 problem. */
  rateLimit?: RateLimitName;
  /** Roles that may use the route; anyone else gets the same 404 as an unknown address (L2-074.1). */
  roles?: Role[];
  /** The answer may hold personal data: `private, no-store`, never cached (L2-089.3). */
  cache?: 'private';
  /**
   * An admin route (administration/secure-admin-access): a guest, anyone without the Administrator
   * role and an administrator who has not passed the code step all get the same 404 as an unknown
   * address, never 401 or 403 (L2-066.1, L2-074.1). The terms gate does not apply.
   */
  admin?: true;
  /** An upload route: a body up to this many bytes instead of the 1 MB JSON limit (L2-075.4), as multipart or the named types. */
  upload?: { maxBytes: number; types?: string[] };
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
const METHODS: readonly Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CORS_HEADERS = 'Content-Type, Accept, X-Requested-With, X-XSRF-TOKEN, X-Request-Id';
/**
 * The routes a person who has not accepted the current terms may still use (L2-080.3): who is
 * signed in and their theme, signing out, and accepting the terms. Everything else answers 409.
 */
const OPEN_WHILE_TERMS_UNACCEPTED = new Set([
  'me.show',
  'me.preferences',
  'session.destroy',
  'account.consents.terms',
]);

/** Wraps one handler in the pipeline. */
export function route(options: RouteOptions, handler: Handler): Handler {
  return async (request, context) => {
    const startedAt = performance.now();
    const requestId = requestIdFor(request);
    const api = request.nextUrl.pathname.startsWith('/api/v1');
    const session = api && isStateful(request) ? await loadSession(request) : undefined;
    return runWithRequestContext({ requestId, session, user: null }, async (ctx) => {
      let response: Response;
      try {
        if (session !== undefined) ctx.user = await signedInUser(session);
        if (session !== undefined && ctx.user !== null) await touchSession(session);
        if (session !== undefined && ctx.user?.roles.includes(Role.Administrator) === true) {
          // An administrator's session ends after 30 minutes without a request, on any route (L2-066.2).
          if (adminIdledOut(session)) {
            await forgetSession(session.id);
            await session.invalidate();
            ctx.user = null;
            throw new HttpProblem(ProblemType.Unauthenticated, {
              detail: 'The administrator session was idle for 30 minutes.',
            });
          }
          touchAdminActivity(session);
        }
        if (
          session !== undefined &&
          MUTATING.has(request.method) &&
          !session.tokenMatches(request.headers.get(XSRF_HEADER))
        ) {
          throw new HttpProblem(ProblemType.CsrfTokenMismatch, {
            detail: 'Fetch /api/v1/csrf-cookie, then repeat the request with X-XSRF-TOKEN.',
          });
        }
        const admitted = await gateBody(
          request,
          options.upload === undefined
            ? JSON_BODY_RULE
            : {
                maxBytes: options.upload.maxBytes,
                multipart: true,
                ...(options.upload.types !== undefined && { types: options.upload.types }),
              },
        );
        if (api) await enforceRateLimit('api', request, ctx.user);
        if (
          options.admin === true &&
          (session === undefined ||
            ctx.user === null ||
            !ctx.user.roles.includes(Role.Administrator) ||
            !isMfaVerified(session))
        ) {
          throw new HttpProblem(ProblemType.NotFound, {
            detail: 'No route matches this address.',
          });
        }
        if (api && ctx.user === null && !PUBLIC_ROUTES.has(options.name)) {
          throw new HttpProblem(ProblemType.Unauthenticated, {
            detail: 'This needs a signed-in account.',
          });
        }
        if (options.roles !== undefined && !holdsOneOf(ctx.user, options.roles)) {
          throw new HttpProblem(ProblemType.NotFound, {
            detail: 'No route matches this address.',
          });
        }
        if (
          api &&
          options.admin !== true &&
          ctx.user !== null &&
          !OPEN_WHILE_TERMS_UNACCEPTED.has(options.name) &&
          (await termsAcceptanceRequired(ctx.user.id))
        ) {
          throw new HttpProblem(ProblemType.TermsAcceptanceRequired, {
            detail: 'Accept the current terms first.',
          });
        }
        if (options.rateLimit !== undefined) {
          await enforceRateLimit(options.rateLimit, request, ctx.user);
        }
        response = await handler(admitted, context);
      } catch (error) {
        response = responseForError(error);
      }
      if (session !== undefined) {
        await session.save();
        response = withSessionCookies(response, session);
      }
      response = withHeaders(response, request, requestId, options, ctx.user !== null);
      logger().info(
        {
          method: request.method,
          route: options.name,
          path: request.nextUrl.pathname,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          ...(ctx.user !== null && { userId: ctx.user.id }),
        },
        'request',
      );
      return response;
    });
  };
}

/**
 * The handlers a route file exports: the given methods through the pipeline, OPTIONS answering CORS
 * preflights, and every other method a 405 problem naming the allowed ones. HEAD is left to Next.js,
 * which derives it from GET.
 */
export function routes(
  handlers: Partial<Record<Exclude<Method, 'OPTIONS'>, Handler>>,
  options: RouteOptions,
): Record<Method, Handler> {
  const allowed = METHODS.filter((method) => method === 'OPTIONS' || method in handlers);
  const allow = allowed.join(', ');
  const result = {} as Record<Method, Handler>;
  for (const method of METHODS) {
    if (method === 'OPTIONS') {
      result[method] = route({ name: options.name }, preflight(allow));
      continue;
    }
    const handler = handlers[method];
    const name = options.names?.[method] ?? options.name;
    // A method the route lacks keeps the admin gate, so an admin route stays concealed on every method.
    result[method] = route(
      handler
        ? { ...options, name }
        : { name: `${name}.method-not-allowed`, ...(options.admin === true && { admin: true }) },
      handler ?? methodNotAllowed(allow),
    );
  }
  return result;
}

/**
 * The account a session belongs to. At the 30-day limit the session is ended, the request answered
 * 401, and the next request is a guest's (L2-073.3).
 */
async function signedInUser(session: Session): Promise<CurrentUser | null> {
  if (session.userId === undefined) return null;
  if (absoluteLimitReached(session.data.startedAt)) {
    await forgetSession(session.id);
    await session.invalidate();
    throw new HttpProblem(ProblemType.Unauthenticated, {
      detail: 'The session reached its 30-day limit.',
    });
  }
  const user = await loadCurrentUser(session.userId);
  if (user === null) {
    await session.invalidate();
    throw new HttpProblem(ProblemType.Unauthenticated, {
      detail: 'This needs a signed-in account.',
    });
  }
  return user;
}

function holdsOneOf(user: CurrentUser | null, roles: Role[]): boolean {
  return user !== null && roles.some((role) => user.roles.includes(role));
}

function requestIdFor(request: NextRequest): string {
  const inbound = request.headers.get('x-request-id');
  return inbound !== null && UUID.test(inbound) ? inbound.toLowerCase() : randomUUID();
}

function responseForError(error: unknown): Response {
  if (error instanceof HttpProblem || error instanceof HttpRedirect) return error.toResponse();
  logger().error({ err: error }, 'unhandled error');
  return problemResponse(ProblemType.ServerError, {
    detail:
      'Something went wrong on our side. Try again, and tell us the reference if it keeps happening.',
  });
}

function withHeaders(
  response: Response,
  request: NextRequest,
  requestId: string,
  options: RouteOptions,
  signedIn: boolean,
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Request-Id', requestId);
  if (options.cache === 'private' || (signedIn && !PUBLIC_ROUTES.has(options.name))) {
    headers.set('Cache-Control', 'private, no-store');
  }
  const origin = request.headers.get('origin');
  if (origin !== null && config().webOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Expose-Headers', 'X-Request-Id, Retry-After');
    headers.append('Vary', 'Origin');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function preflight(allow: string): Handler {
  return (request) => {
    const origin = request.headers.get('origin');
    const headers = new Headers({ Allow: allow });
    if (origin !== null && config().webOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Methods', allow);
      headers.set(
        'Access-Control-Allow-Headers',
        request.headers.get('access-control-request-headers') ?? CORS_HEADERS,
      );
      headers.set('Access-Control-Max-Age', '600');
    }
    return new Response(null, { status: 204, headers });
  };
}

function methodNotAllowed(allow: string): Handler {
  return () =>
    problemResponse(httpError(405, 'Method Not Allowed'), {
      detail: `This address answers ${allow}.`,
      headers: { Allow: allow },
    });
}
