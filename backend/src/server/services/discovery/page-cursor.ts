import type { SearchSort } from '@/server/enums';

/**
 * An opaque, URL-safe position in the lineup: the sort and the sort key of the last ticket
 * returned (L2-095.1). A cursor from another sort does not decode.
 */
export function encodeCursor(sort: SearchSort, after: number[]): string {
  return Buffer.from(JSON.stringify({ s: sort, k: after })).toString('base64url');
}

/** The sort key to continue after, or null when the cursor does not decode for this sort. */
export function decodeCursor(cursor: string, sort: SearchSort): number[] | null {
  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const { s, k } = data as { s?: unknown; k?: unknown };
  if (s !== sort || !Array.isArray(k) || !k.every((part) => typeof part === 'number')) return null;
  return k;
}
