/** A published profile as `GET /api/v1/sitemap` lists it. */
export interface SitemapProfile {
  slug: string;
  /** `YYYY-MM-DD`. */
  lastModified: string;
}

/**
 * `/robots.txt` (L2-112.4): the private areas are off limits. `Allow: /artists/` keeps the public
 * profiles in, because `Disallow: /artist` (the artist's own area) would otherwise match them too.
 */
export function robotsTxt(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /artists/',
    'Disallow: /admin',
    'Disallow: /artist',
    'Disallow: /bookings',
    'Disallow: /saved',
    'Disallow: /api',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

/** `/sitemap.xml` (L2-112.3): Discover and every published profile, at this site's addresses. */
export function sitemapXml(origin: string, profiles: readonly SitemapProfile[]): string {
  const urls = [
    `  <url><loc>${escapeXml(`${origin}/`)}</loc></url>`,
    ...profiles.map(
      (profile) =>
        `  <url><loc>${escapeXml(`${origin}/artists/${encodeURIComponent(profile.slug)}`)}</loc>` +
        `<lastmod>${escapeXml(profile.lastModified)}</lastmod></url>`,
    ),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

function escapeXml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!,
  );
}
