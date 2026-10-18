import { config } from '@config/zamaro';

/**
 * Public URLs for keys on the media disk. In M1 the disk is the API's local disk, served under
 * /media; M4 points ZAMARO_MEDIA_URL at object storage behind the CDN without touching callers.
 */
export function mediaUrl(key: string): string {
  return `${config().mediaUrl}/${key.replace(/^\/+/, '')}`;
}

/** Poster frames are stored as one 16:9 WebP. */
const POSTER_WIDTH = 800;
const POSTER_HEIGHT = 450;

/** A video's poster frame as the frontend draws it, or null to keep the halftone placeholder. */
export function videoPoster(
  posterKey: string | null,
): { src: string; width: number; height: number } | null {
  return posterKey === null
    ? null
    : { src: mediaUrl(posterKey), width: POSTER_WIDTH, height: POSTER_HEIGHT };
}
