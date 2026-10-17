import { and, eq, inArray } from 'drizzle-orm';
import { config } from '@config/zamaro';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { VscStatus } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { readDocument } from '@/server/services/artist-onboarding/document-vault';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { signedPathIsValid } from '@/server/support/signed-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

// A private document behind a valid signed link, on the media host alone (L2-076.3, L2-089, M3
// D10): decrypted on the way out, as a download with the server's own type and name, never cached,
// never sniffed, never scripted. The same path on the API host, an altered signature and a link that
// has run out are all the 404 of an unknown address.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, context) => {
      const { key } = await context.params;
      const path = request.nextUrl.pathname;
      if (
        request.nextUrl.host !== config().mediaHost ||
        typeof key !== 'string' ||
        !/^[0-9a-f]{32}$/.test(key) ||
        !signedPathIsValid(path, request.nextUrl.searchParams)
      ) {
        throw notFound();
      }
      const [check] = await db()
        .select({
          storageKey: vulnerableSectorChecks.storageKey,
          wrappedDataKey: vulnerableSectorChecks.wrappedDataKey,
          mimeType: vulnerableSectorChecks.mimeType,
        })
        .from(vulnerableSectorChecks)
        .where(
          and(
            eq(vulnerableSectorChecks.storageKey, key),
            inArray(vulnerableSectorChecks.status, [VscStatus.Pending, VscStatus.Verified]),
          ),
        );
      if (check?.storageKey === null || check?.wrappedDataKey === null || check === undefined) {
        throw notFound();
      }
      const bytes = await readDocument({
        key: check.storageKey,
        wrappedDataKey: check.wrappedDataKey,
      });
      const mime = check.mimeType ?? 'application/octet-stream';
      return new Response(new Uint8Array(bytes), {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(bytes.byteLength),
          'Content-Disposition': `attachment; filename="vulnerable-sector-check.${EXTENSIONS[mime] ?? 'bin'}"`,
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'; sandbox",
        },
      });
    },
  },
  { name: 'documents.show' },
);

function notFound(): HttpProblem {
  return new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
}
