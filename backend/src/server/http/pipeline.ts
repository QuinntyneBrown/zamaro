import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';
import { logger } from '../support/logger';
import { enforceRateLimit, type RateLimitName } from './rate-limits';
import { HttpProblem, httpError, problemResponse, ProblemType } from '../support/problems';
import { runWithRequestContext } from '../support/request-context';

/**
 * The request pipeline (ADR-0027): the one place that fixes what happens around every route handler.
 * Order: request ID → request logging → problem-details error handling → CORS → rate limit → the handler.
 * Logging wraps error handling, so handled statuses are logged (AGENTS.md).
 */

export interface RouteContext {
  params: Promise<Record<string, string | string[] | undefined>>;
}
export type Handler = (request: NextRequest, context: RouteContext) => Promise<Response> | Response;

export interface RouteOptions {
  /** The route's name in the request log, e.g. `health.live`. */
  name: string;
  /** The named rate limit the route is behind (L2-077); over it, a 429 problem. */
  rateLimit?: RateLimitName;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
const METHODS: readonly Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CORS_HEADERS = 'Content-Type, Accept, X-Requested-With, X-XSRF-TOKEN, X-Request-Id';

/** Wraps one handler in the pipeline. */
export function route(options: RouteOptions, handler: Handler): Handler {
  return async (request, context) => {
    const startedAt = performance.now();
    const requestId = requestIdFor(request);
    return runWithRequestContext({ requestId }, async () => {
      let response: Response;
      try {
        if (options.rateLimit !== undefined) await enforceRateLimit(options.rateLimit, request);
        response = await handler(request, context);
      } catch (error) {
        response = responseForError(error);
      }
      response = withHeaders(response, request, requestId);
      logger().info(
        {
          method: request.method,
          route: options.name,
          path: request.nextUrl.pathname,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
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
    const handler = method === 'OPTIONS' ? preflight(allow) : handlers[method];
    result[method] = route(
      handler ? options : { name: `${options.name}.method-not-allowed` },
      handler ?? methodNotAllowed(allow),
    );
  }
  return result;
}

function requestIdFor(request: NextRequest): string {
  const inbound = request.headers.get('x-request-id');
  return inbound !== null && UUID.test(inbound) ? inbound.toLowerCase() : randomUUID();
}

function responseForError(error: unknown): Response {
  if (error instanceof HttpProblem) return error.toResponse();
  logger().error({ err: error }, 'unhandled error');
  return problemResponse(ProblemType.ServerError, {
    detail:
      'Something went wrong on our side. Try again, and tell us the reference if it keeps happening.',
  });
}

function withHeaders(response: Response, request: NextRequest, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Request-Id', requestId);
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
