import { config } from '@config/zamaro';
import { startVideoUpload } from '@/server/actions/artist-onboarding/application-videos';
import { routes } from '@/server/http/pipeline';
import { StartApplicationVideoUploadRequest } from '@/server/http/requests/artist-onboarding/application-video';
import { toApplicationVideoResource } from '@/server/http/resources/artist-onboarding/application-video';
import { validateBody } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Start a video upload before any account exists (apply-as-artist, ADR-0026): answers the token every
// chunk, offset question and the application itself name, and Location, where the chunks go.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const { title, fileName, size } = await validateBody(
        request,
        StartApplicationVideoUploadRequest,
      );
      const video = await startVideoUpload(title, fileName, size);
      return Response.json(
        { data: toApplicationVideoResource(video) },
        {
          status: 201,
          headers: {
            Location: `${config().appUrl}/api/v1/artist-applications/videos/${video.uploadToken ?? ''}`,
          },
        },
      );
    },
  },
  { name: 'artist-applications.videos.store', cache: 'private' },
);
