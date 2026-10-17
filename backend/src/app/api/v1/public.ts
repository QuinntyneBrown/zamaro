/**
 * The intentional anonymous routes under /api/v1, by the name each route file gives the pipeline
 * (ADR-0027). Every other route needs a signed-in account; a route not listed here answers 401 to a
 * guest. Health and media live outside /api/v1 and need no session.
 */
export const PUBLIC_ROUTES: ReadonlySet<string> = new Set([
  'not-found',
  'test.boom',
  'i18n.show',
  'features',
  'places',
  'search',
  'search.alternatives',
  'artists.show',
  'artists.reviews',
  'artists.tour-dates',
  'artists.availability',
  'sitemap',
  // The CSRF cookie and signing in: anonymous, answered privately (L2-089.3).
  'csrf-cookie',
  'session.store',
  'register',
  'legal-documents.current',
  'email.verify',
  'email.resend-verification',
]);
