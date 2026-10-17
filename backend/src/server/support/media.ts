import { config } from '@config/zamaro';

/**
 * Public URLs for keys on the media disk. In M1 the disk is the API's local disk, served under
 * /media; M4 points ZAMARO_MEDIA_URL at object storage behind the CDN without touching callers.
 */
export function mediaUrl(key: string): string {
  return `${config().mediaUrl}/${key.replace(/^\/+/, '')}`;
}
