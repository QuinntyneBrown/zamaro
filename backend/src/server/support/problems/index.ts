import { config } from '@config/zamaro';
import { currentRequestId } from '../request-context';

/**
 * RFC 9457 problem details (L2-095.2, ADR-0005). Every error answers `application/problem+json`
 * with `type`, `title`, `status`, `detail` and the `requestId` extension; 422 adds `errors`.
 */
export interface ProblemTypeDefinition {
  /** The last segment of the type URI under `{APP_URL}/problems`, or `about:blank`. */
  slug: string;
  status: number;
  title: string;
}

export const ProblemType = {
  NotFound: { slug: 'not-found', status: 404, title: 'Not found' },
  ServerError: { slug: 'server-error', status: 500, title: 'Something went wrong on our side' },
} as const satisfies Record<string, ProblemTypeDefinition>;

export interface ProblemOptions {
  detail?: string;
  extensions?: Record<string, unknown>;
  headers?: HeadersInit;
}

/** Thrown by handlers, actions and policies; the pipeline renders it. */
export class HttpProblem extends Error {
  constructor(
    readonly type: ProblemTypeDefinition,
    readonly options: ProblemOptions = {},
  ) {
    super(options.detail ?? type.title);
    this.name = 'HttpProblem';
  }

  toResponse(): Response {
    return problemResponse(this.type, this.options);
  }
}

/** An HTTP error with no Zamaro meaning (405 and similar): `about:blank` and the reason phrase. */
export function httpError(status: number, reasonPhrase: string): ProblemTypeDefinition {
  return { slug: 'about:blank', status, title: reasonPhrase };
}

export function problemResponse(
  type: ProblemTypeDefinition,
  options: ProblemOptions = {},
): Response {
  const typeUri =
    type.slug === 'about:blank' ? 'about:blank' : `${config().problemsBaseUri}/${type.slug}`;
  const body = {
    type: typeUri,
    title: type.title,
    status: type.status,
    detail: options.detail ?? type.title,
    requestId: currentRequestId(),
    ...options.extensions,
  };
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/problem+json');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { status: type.status, headers });
}
