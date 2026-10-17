import {
  appendVideoChunk,
  findVideoByToken,
  type VideoRow,
} from '@/server/actions/artist-onboarding/application-videos';
import { routes, type RouteContext } from '@/server/http/pipeline';
import { toApplicationVideoResource } from '@/server/http/resources/artist-onboarding/application-video';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Chunks are `application/offset+octet-stream`, 8 MB at most. */
export const CHUNK_TYPE = 'application/offset+octet-stream';
const CHUNK_CAP_BYTES = 8 * 1024 * 1024;

// GET (and HEAD) answer the upload's state: Upload-Offset and Upload-Length say where it is, so a
// browser resumes after a dropped connection; the body says whether it is still uploading,
// processing, live or failed. PATCH appends a chunk: the body is the bytes from Upload-Offset, which
// must be where the upload ends; the answer's Upload-Offset is where the next chunk starts, and the
// last chunk sends the file through the scan and the transcoder (ADR-0026).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (_request, context) => {
      const video = await videoOf(context);
      return Response.json(
        { data: toApplicationVideoResource(video) },
        {
          headers: {
            'Upload-Offset': String(video.uploadedBytes),
            'Upload-Length': String(video.sizeBytes ?? 0),
          },
        },
      );
    },
    PATCH: async (request, context) => {
      const type = (request.headers.get('content-type') ?? '').toLowerCase();
      if (!type.startsWith(CHUNK_TYPE)) {
        throw new HttpProblem(ProblemType.UnsupportedMediaType, {
          detail: `Send the chunk as ${CHUNK_TYPE}.`,
        });
      }
      const video = await videoOf(context);
      const offset = Number(request.headers.get('upload-offset') ?? '0');
      const chunk = Buffer.from(await request.arrayBuffer());
      const next = await appendVideoChunk(video.id, offset, chunk);
      return new Response(null, { status: 204, headers: { 'Upload-Offset': String(next) } });
    },
  },
  {
    name: 'artist-applications.videos.show',
    names: { PATCH: 'artist-applications.videos.append' },
    upload: { maxBytes: CHUNK_CAP_BYTES, types: [CHUNK_TYPE] },
    cache: 'private',
  },
);

async function videoOf(context: RouteContext): Promise<VideoRow> {
  const { token } = await context.params;
  const video = typeof token === 'string' ? await findVideoByToken(token) : null;
  if (video === null) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  return video;
}
