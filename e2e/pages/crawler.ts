import type { Page } from '@playwright/test';
import { readHead, type PageHead } from './page-head';

/** One `<url>` of the sitemap. */
export interface SitemapEntry {
  loc: string;
  lastmod: string | null;
}

/**
 * What a search engine's crawler receives from the web server: the server-rendered HTML of a page,
 * read without running any script, `/robots.txt` and `/sitemap.xml` (L2-112).
 */
export class Crawler {
  constructor(private readonly page: Page) {}

  /** Requests a page as a crawler would and reads the head of the HTML it got. */
  async read(path: string): Promise<PageHead> {
    const response = await this.page.request.get(path);
    return readHead(this.page, await response.text());
  }

  /** The rules in `/robots.txt`, one trimmed line each, comments left out. */
  async robots(): Promise<string[]> {
    const text = await (await this.page.request.get('/robots.txt')).text();
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  }

  async sitemap(): Promise<{ contentType: string; entries: SitemapEntry[] }> {
    const response = await this.page.request.get('/sitemap.xml');
    const entries = await this.page.evaluate(
      (xml) => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        return [...doc.getElementsByTagName('url')].map((url) => ({
          loc: url.getElementsByTagName('loc')[0]?.textContent ?? '',
          lastmod: url.getElementsByTagName('lastmod')[0]?.textContent ?? null,
        }));
      },
      await response.text(),
    );
    return { contentType: response.headers()['content-type'] ?? '', entries };
  }
}
