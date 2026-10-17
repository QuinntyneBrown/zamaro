import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * A public, revalidating JSON answer (L2-089.1): a strong ETag of the body, `Cache-Control: public,
 * max-age=0, s-maxage={seconds}`, and a bodiless 304 when `If-None-Match` carries the same ETag.
 */
export function cachedJson(
  request: NextRequest,
  body: unknown,
  {
    sharedMaxAge = 60,
    headers = {},
  }: { sharedMaxAge?: number; headers?: Record<string, string> } = {},
): Response {
  const json = JSON.stringify(body);
  const etag = `"${createHash('sha256').update(json).digest('hex')}"`;
  const responseHeaders = {
    ...headers,
    ETag: etag,
    'Cache-Control': `public, max-age=0, s-maxage=${String(sharedMaxAge)}`,
  };
  if (matches(request.headers.get('if-none-match'), etag)) {
    return new Response(null, { status: 304, headers: responseHeaders });
  }
  return new Response(json, {
    status: 200,
    headers: { ...responseHeaders, 'Content-Type': 'application/json' },
  });
}

function matches(ifNoneMatch: string | null, etag: string): boolean {
  if (ifNoneMatch === null) return false;
  return ifNoneMatch
    .split(',')
    .map((candidate) => candidate.trim().replace(/^W\//, ''))
    .some((candidate) => candidate === '*' || candidate === etag);
}
