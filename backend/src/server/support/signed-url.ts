import { createHmac, timingSafeEqual } from 'node:crypto';
import { securityConfig } from '@config/security';
import { now } from './clock';

/**
 * Temporary signed links (L2-076.3, scan-and-serve-uploads): the path and its expiry carry an HMAC
 * of the signing key, so a link is good only as issued and only until it runs out. The media host
 * checks a link the same way the API signed it.
 */
export function signedUrl(origin: string, path: string, expiresAtSeconds: number): string {
  const query = `expires=${String(expiresAtSeconds)}`;
  return `${origin}${path}?${query}&signature=${signatureOf(`${path}?${query}`)}`;
}

/** Whether the path's signature is the one the API issued, and the link has not run out. */
export function signedPathIsValid(path: string, params: URLSearchParams): boolean {
  const expires = params.get('expires');
  const signature = params.get('signature');
  if (expires === null || signature === null || !/^\d+$/.test(expires)) return false;
  if (Number(expires) < now().toSeconds()) return false;
  const expected = Buffer.from(signatureOf(`${path}?expires=${expires}`));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function signatureOf(payload: string): string {
  return createHmac('sha256', securityConfig().urlSigningKey).update(payload).digest('hex');
}
