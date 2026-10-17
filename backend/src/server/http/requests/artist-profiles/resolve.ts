import type { NextRequest } from 'next/server';
import { ArtistMoved } from '@/server/services/artist-profiles/resolve-artist-slug';
import { HttpRedirect } from '@/server/support/problems';

/**
 * Runs an artist action for `/artists/{slug}/...`; when the slug is retired, the same address
 * under the current slug, with the query string kept, as a 301 (L2-021.3).
 */
export async function underArtistSlug<T>(
  request: NextRequest,
  slug: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ArtistMoved) {
      const { pathname, search } = request.nextUrl;
      const moved = pathname.replace(
        `/artists/${encodeURIComponent(slug)}`,
        `/artists/${error.currentSlug}`,
      );
      throw new HttpRedirect(301, `${moved}${search}`);
    }
    throw error;
  }
}

/** The `{slug}` route parameter as a string. */
export function slugParam(params: Record<string, string | string[] | undefined>): string {
  const slug = params.slug;
  return typeof slug === 'string' ? slug : '';
}
