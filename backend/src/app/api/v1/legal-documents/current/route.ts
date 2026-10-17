import { db } from '@/server/db/client';
import { ConsentKind } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { toLegalDocumentResource } from '@/server/http/resources/privacy/legal-document';
import { currentLegalDocument } from '@/server/services/privacy/legal-document-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The current terms of use and privacy policy: the sign-up form sends back the versions it showed
// (L2-080.1).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const [terms, privacyPolicy] = await Promise.all([
        currentLegalDocument(db(), ConsentKind.Terms),
        currentLegalDocument(db(), ConsentKind.PrivacyPolicy),
      ]);
      return Response.json({
        data: {
          terms: toLegalDocumentResource(terms),
          privacyPolicy: toLegalDocumentResource(privacyPolicy),
        },
      });
    },
  },
  { name: 'legal-documents.current' },
);
