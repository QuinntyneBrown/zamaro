import { uploadVulnerableSectorCheck } from '@/server/actions/artist-onboarding/upload-vulnerable-sector-check';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { parseCheckUpload } from '@/server/http/requests/artist-onboarding/vulnerable-sector-check';
import { toCheckResource } from '@/server/http/resources/artist-onboarding/vulnerable-sector-check';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The check is a multipart upload: a 32 MB hard cap, and the form's own 10 MB rule with its copy (L2-049.1). */
const UPLOAD_CAP_BYTES = 32 * 1024 * 1024;

// Upload a check: multipart/form-data with the scan (PDF, JPEG or PNG up to 10 MB, typed by its
// content, never by its name) and the issue date. Answers 202: the check is `scanning` until the
// malware scan passes, then `pending` for an administrator (L2-049.1, L2-076.1). Artists only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const { id } = requireUser();
      const { bytes, issuedOn } = await parseCheckUpload(request);
      const check = await uploadVulnerableSectorCheck(id, bytes, issuedOn);
      return Response.json({ data: toCheckResource(check) }, { status: 202 });
    },
  },
  {
    name: 'artist.vulnerable-sector-checks.store',
    roles: [Role.Artist],
    upload: { maxBytes: UPLOAD_CAP_BYTES },
    cache: 'private',
  },
);
