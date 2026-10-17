import { routes } from '@/server/http/pipeline';
import { disk } from '@/server/integrations/storage/disks';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The types the media disk holds: photo renditions, posters, HLS streams and captions. */
const TYPES: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  vtt: 'text/vtt; charset=utf-8',
  webp: 'image/webp',
  avif: 'image/avif',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  mp4: 'video/mp4',
};

// The media disk under /media in development and e2e (M1 has no object storage; ADR-0024). Files
// are served without caching here, since the CDN takes this role in production (M4).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (_request, { params }) => {
      const parts = (await params).path;
      const key = Array.isArray(parts) ? parts.join('/') : '';
      const contents =
        key === ''
          ? null
          : await disk('media')
              .get(key)
              .catch(() => null);
      if (contents === null) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No such file on the media disk.' });
      }
      const extension = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
      return new Response(new Uint8Array(contents), {
        status: 200,
        headers: {
          'Content-Type': TYPES[extension] ?? 'application/octet-stream',
          'Content-Length': String(contents.length),
          'Cache-Control': 'no-store',
        },
      });
    },
  },
  { name: 'media' },
);
