import { DOCUMENT } from '@angular/common';
import { inject, Injectable, REQUEST } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

/** What a page tells crawlers and link previews about itself (L2-112, L2-113). */
export interface PageMetadata {
  /** The page's own name; " · Zamaro" is added. */
  title: string;
  description?: string;
  /** The page's one preferred address, without a query string. Pages kept out of the index have none. */
  path?: string;
  /** `profile` for an artist, `website` otherwise. */
  type?: 'website' | 'profile';
  /** The link preview's image; a relative URL is made absolute. */
  image?: { src: string; alt: string } | null;
  /** A schema.org object, written as JSON-LD. */
  structuredData?: Record<string, unknown> | null;
  /** False keeps the page out of search results (`noindex`): the 404s. */
  index?: boolean;
}

const SITE_NAME = 'Zamaro';

/**
 * The document head for the current page: title, description, canonical link, Open Graph and Twitter
 * card tags and JSON-LD. Pages call `set` on the server, so crawlers read it without running script,
 * and again in the browser after client-side navigation; every call replaces all of it, so nothing
 * from the previous page is left behind.
 */
@Injectable({ providedIn: 'root' })
export class PageMeta {
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly transloco = inject(TranslocoService);

  /**
   * Where the site is served from. On the server it is the address the request came to; in the
   * browser, the page's own.
   */
  readonly origin = this.request ? new URL(this.request.url).origin : this.document.location.origin;

  /** An address on this site as an absolute URL. */
  url(path: string): string {
    return new URL(path, this.origin).href;
  }

  set(page: PageMetadata): void {
    const title = this.transloco.translate('common.meta.title', { page: page.title });
    const canonical = page.path === undefined ? null : this.url(page.path);
    const image = page.image ? { ...page.image, src: this.url(page.image.src) } : null;

    this.title.setTitle(title);
    this.tag('name', 'description', page.description);
    this.tag('name', 'robots', page.index === false ? 'noindex' : undefined);
    this.canonical(canonical);

    this.tag('property', 'og:site_name', SITE_NAME);
    this.tag('property', 'og:type', page.type ?? 'website');
    this.tag('property', 'og:title', title);
    this.tag('property', 'og:description', page.description);
    this.tag('property', 'og:url', canonical ?? undefined);
    this.tag('property', 'og:image', image?.src);
    this.tag('property', 'og:image:alt', image?.alt);
    this.tag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    this.tag('name', 'twitter:title', title);
    this.tag('name', 'twitter:description', page.description);
    this.tag('name', 'twitter:image', image?.src);
    this.tag('name', 'twitter:image:alt', image?.alt);

    this.structuredData(page.structuredData ?? null);
  }

  private tag(attribute: 'name' | 'property', key: string, content: string | undefined): void {
    const selector = `${attribute}="${key}"`;
    if (content === undefined) this.meta.removeTag(selector);
    else this.meta.updateTag({ [attribute]: key, content }, selector);
  }

  private canonical(href: string | null): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  /**
   * One JSON-LD block. `<` is escaped, so artist text can never close the script element in the
   * server-rendered HTML (L2-075).
   */
  private structuredData(data: Record<string, unknown> | null): void {
    let script = this.document.head.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );
    if (!data) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}
