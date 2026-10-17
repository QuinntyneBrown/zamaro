import { NextRequest } from 'next/server';
import { HttpProblem, ProblemType } from '../support/problems';

/**
 * The body gate (security/authorise-and-validate-requests): the API takes JSON, so a body of any
 * other kind is refused with 415 (L2-095.1), and a body over 1 MB with 413 before it is parsed
 * (L2-075.4). A declared length over the limit is refused without reading the body at all.
 */
export const MAX_BODY_BYTES = 1_048_576;

const JSON_TYPES = /^application\/(?:[\w.+-]+\+)?json(?:\s*;.*)?$/i;

/** The request with its body read and admitted, or the problem that refuses it. */
export async function gateBody(request: NextRequest): Promise<NextRequest> {
  if (request.body === null) return request;
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) throw tooLarge();
  const bytes = await readUpTo(request.body, MAX_BODY_BYTES);
  if (bytes === undefined) throw tooLarge();
  if (bytes.byteLength === 0) return request;
  const contentType = request.headers.get('content-type') ?? '';
  if (!JSON_TYPES.test(contentType)) {
    throw new HttpProblem(ProblemType.UnsupportedMediaType, {
      detail: 'Send the body as application/json.',
    });
  }
  return new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: bytes,
  });
}

/** The whole stream as bytes, or `undefined` once it passes the limit. */
async function readUpTo(
  stream: ReadableStream<Uint8Array>,
  limit: number,
): Promise<Uint8Array<ArrayBuffer> | undefined> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) return undefined;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function tooLarge(): HttpProblem {
  return new HttpProblem(ProblemType.PayloadTooLarge, {
    detail: 'The body may be at most 1 MB.',
  });
}
