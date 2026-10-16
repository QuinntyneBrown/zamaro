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

/** The problem types the API returns; a type is added only when a slice answers it. */
export const ProblemType = {
  Unauthenticated: { slug: 'unauthenticated', status: 401, title: 'Sign in to continue' },
  CsrfTokenMismatch: {
    slug: 'csrf-token-mismatch',
    status: 419,
    title: 'The page’s security token didn’t match',
  },
  NotFound: { slug: 'not-found', status: 404, title: 'Not found' },
  ArtistNotFound: { slug: 'artist-not-found', status: 404, title: 'This artist isn’t on Zamaro' },
  ValidationFailed: {
    slug: 'validation-failed',
    status: 422,
    title: 'Check the highlighted fields',
  },
  PayloadTooLarge: { slug: 'payload-too-large', status: 413, title: 'The request is too large' },
  UnsupportedMediaType: {
    slug: 'unsupported-media-type',
    status: 415,
    title: 'Send the request as JSON',
  },
  LegalDocumentOutdated: {
    slug: 'legal-document-outdated',
    status: 409,
    title: 'The terms have changed',
  },
  TermsAcceptanceRequired: {
    slug: 'terms-acceptance-required',
    status: 409,
    title: 'Accept the updated terms',
  },
  LinkExpired: { slug: 'link-expired', status: 410, title: 'This link has expired' },
  TwoFactorAlreadyOn: {
    slug: 'two-factor-already-on',
    status: 409,
    title: 'Two-step sign-in is already on',
  },
  TwoFactorRequired: {
    slug: 'two-factor-required',
    status: 409,
    title: 'Administrators keep two-step sign-in on',
  },
  VscAlreadyDecided: {
    slug: 'vsc-already-decided',
    status: 409,
    title: 'This check was already decided',
  },
  UploadOffsetMismatch: {
    slug: 'upload-offset-mismatch',
    status: 409,
    title: 'The upload is further along than this chunk',
  },
  ApplicationInReview: {
    slug: 'application-in-review',
    status: 409,
    title: 'You already have an application in review',
  },
  SavedArtistLimit: {
    slug: 'saved-artist-limit',
    status: 422,
    title: 'You can save up to 200 artists',
  },
  TooManyRequests: { slug: 'too-many-requests', status: 429, title: 'Too many requests' },
  SignInPaused: { slug: 'sign-in-paused', status: 429, title: 'Sign-in is paused for 15 minutes' },
  ServerError: { slug: 'server-error', status: 500, title: 'Something went wrong' },
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

/** A 422 problem whose `errors` are keyed by field, each with the copy the form shows (L2-095.2). */
export class ValidationProblem extends HttpProblem {
  constructor(readonly errors: Record<string, string[]>) {
    super(ProblemType.ValidationFailed, {
      detail: 'Some fields need attention.',
      extensions: { errors },
    });
    this.name = 'ValidationProblem';
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
