import { asc, eq } from 'drizzle-orm';
import { submitArtistApplication } from '@/server/actions/artist-onboarding/submit-artist-application';
import { db } from '@/server/db/client';
import { applicationReferences, artistVideos } from '@/server/db/schema';
import { assertBotChallengePassed } from '@/server/http/bot-challenge';
import { routes } from '@/server/http/pipeline';
import { validateApplication } from '@/server/http/requests/artist-onboarding/application';
import { toArtistApplicationResource } from '@/server/http/resources/artist-onboarding/application';
import { jsonBody } from '@/server/http/validation';
import { currentUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Send an application (apply-as-artist, L2-047): 201 with the application, its number and its
// reply-by date. A retry carrying the same Idempotency-Key answers 200 with the application it
// already created (L2-047.5). The bot challenge runs first (L2-077.4).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const body = await jsonBody(request);
      await assertBotChallengePassed(body, request, 'artist-application');
      const input = validateApplication({
        ...(body as Record<string, unknown>),
        idempotencyKey: request.headers.get('idempotency-key') ?? undefined,
      });
      const { application, created } = await submitArtistApplication(
        input,
        currentUser()?.id ?? null,
      );
      const [videos, references] = await Promise.all([
        db()
          .select({
            token: artistVideos.uploadToken,
            title: artistVideos.title,
            status: artistVideos.status,
          })
          .from(artistVideos)
          .where(eq(artistVideos.artistApplicationId, application.id))
          .orderBy(asc(artistVideos.position)),
        db()
          .select({ name: applicationReferences.name, church: applicationReferences.church })
          .from(applicationReferences)
          .where(eq(applicationReferences.artistApplicationId, application.id))
          .orderBy(asc(applicationReferences.id)),
      ]);
      return Response.json(
        toArtistApplicationResource({
          application,
          videos: videos.map((video) => ({ ...video, token: video.token ?? '' })),
          references,
        }),
        { status: created ? 201 : 200 },
      );
    },
  },
  { name: 'artist-applications.store', rateLimit: 'register', cache: 'private' },
);
