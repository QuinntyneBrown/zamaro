import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'node:path';
import { robotsTxt, type SitemapProfile, sitemapXml } from './crawler-files';

const browserDistFolder = join(import.meta.dirname, '../browser');
/** The admin application's build, served under /admin to administrators only (ADR-0023). */
const adminDistFolder =
  process.env['ADMIN_DIST'] ?? join(import.meta.dirname, '../../admin/browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Browser calls to /api go to the Zamaro API. In production the load balancer routes
 * them before requests reach this server; locally and in e2e this proxy stands in for it, so the
 * session cookie stays on the site's own origin (ADR-0015). /media is the API's local media disk,
 * which stands in for the CDN until M4 (no object storage in M1).
 */
const apiOrigin = process.env['API_ORIGIN'];
if (apiOrigin) {
  app.use(
    createProxyMiddleware({
      target: apiOrigin,
      changeOrigin: true,
      // X-Forwarded-For carries the browser's address; the API trusts it only from this server.
      xfwd: true,
      pathFilter: ['/api', '/media'],
    }),
  );
}

/** Where the site is served from, as the request reached it. */
function siteOrigin(req: express.Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

/**
 * The /admin gate (L2-066.1, ADR-0023). The admin application is a separate, client-rendered build,
 * so this server decides who gets it: it asks the API, with the browser's cookies, whether the
 * session is an administrator's who signed in with a code (`GET /api/v1/admin/overview`). On 200 the
 * admin build is served, never cached; on anything else the request falls through to the public
 * application, whose wildcard renders the not-found page with a real 404, so a guest, a booker and
 * an artist learn nothing from the address.
 */
const adminApp = express.static(adminDistFolder, {
  index: false,
  redirect: false,
  fallthrough: false,
});
app.use('/admin', async (req, res, next) => {
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      // The API starts the cookie session only for requests from the site's own origin (ADR-0015).
      referer: `${siteOrigin(req)}/`,
      'x-forwarded-for': req.ip ?? '',
    };
    if (req.headers.cookie) headers['cookie'] = req.headers.cookie;
    const answer = await fetch(`${apiOrigin ?? 'http://localhost:8000'}/api/v1/admin/overview`, {
      headers,
    });
    if (answer.status !== 200) {
      next();
      return;
    }
    res.set('Cache-Control', 'private, no-store');
    if (/\.[a-z0-9]+$/i.test(req.path)) {
      adminApp(req, res, next);
      return;
    }
    res.sendFile(join(adminDistFolder, 'index.html'));
  } catch (error) {
    next(error);
  }
});

/** What crawlers may index (L2-112.4). */
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(robotsTxt(siteOrigin(req)));
});

/** Every published profile, from the API, at this site's addresses (L2-112.3). */
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const response = await fetch(`${apiOrigin ?? 'http://localhost:8000'}/api/v1/sitemap`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      res.sendStatus(502);
      return;
    }
    const { data } = (await response.json()) as { data: SitemapProfile[] };
    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=0, s-maxage=60')
      .send(sitemapXml(siteOrigin(req), data));
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
