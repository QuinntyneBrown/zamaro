import type { Page } from "@playwright/test";

/** What a page's `<head>` tells crawlers and link previews (L2-112, L2-113). */
export interface PageHead {
  title: string;
  description: string | null;
  canonical: string | null;
  /** `<meta name="robots">`, such as "noindex". */
  robots: string | null;
  /** Open Graph tags without the `og:` prefix: `{ title, description, image, url, type, ... }`. */
  openGraph: Record<string, string>;
  /** Twitter card tags without the `twitter:` prefix. */
  twitter: Record<string, string>;
  /** Each JSON-LD block, parsed. */
  structuredData: Record<string, unknown>[];
  /** The text of the main region, as a crawler that runs no script reads it. */
  mainText: string;
}

/**
 * Reads the head of the page's live document or, given `html`, of that markup parsed in the browser
 * without running its scripts.
 */
export async function readHead(page: Page, html?: string): Promise<PageHead> {
  return page.evaluate((markup) => {
    const doc =
      markup === undefined
        ? document
        : new DOMParser().parseFromString(markup, "text/html");
    const content = (selector: string) =>
      doc.querySelector(selector)?.getAttribute("content") ?? null;
    const prefixed = (attribute: string, prefix: string) =>
      Object.fromEntries(
        [...doc.querySelectorAll(`meta[${attribute}^="${prefix}"]`)].map(
          (meta) => [
            meta.getAttribute(attribute)!.slice(prefix.length),
            meta.getAttribute("content") ?? "",
          ],
        ),
      );
    return {
      title: doc.title,
      description: content('meta[name="description"]'),
      canonical:
        doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ??
        null,
      robots: content('meta[name="robots"]'),
      openGraph: prefixed("property", "og:"),
      twitter: prefixed("name", "twitter:"),
      structuredData: [
        ...doc.querySelectorAll('script[type="application/ld+json"]'),
      ].map((script) => JSON.parse(script.textContent ?? "null")),
      mainText: (doc.querySelector("main")?.textContent ?? "").replace(
        /\s+/g,
        " ",
      ),
    };
  }, html);
}
