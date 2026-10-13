import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import type { ArtistProfile } from 'api';
import { PageMeta } from '../../shared/page-meta';

/** Meta descriptions are cut at a word to fit this many characters (accepted default, 2026-10-10). */
export const DESCRIPTION_MAX_LENGTH = 160;

/** The photo rendition link previews and structured data use (L2-113.1). */
const PREVIEW_WIDTH = 1200;

/**
 * A profile's head: "{name} · Worship artist in {city} · Zamaro", a description from the headline
 * and bio, the canonical address, the link preview with the primary photo, and JSON-LD — `Person`
 * for a solo act, `MusicGroup` for the rest, with `aggregateRating` once churches have rated them
 * (L2-112.2, L2-113.1). Built from the public profile only (privacy/minimise-public-exposure).
 */
@Injectable({ providedIn: 'root' })
export class ProfileSeo {
  private readonly meta = inject(PageMeta);
  private readonly transloco = inject(TranslocoService);

  /** The profile's one preferred address, which Share also sends. */
  canonical(profile: ArtistProfile): string {
    return this.meta.url(`/artists/${profile.slug}`);
  }

  apply(profile: ArtistProfile): void {
    const url = this.canonical(profile);
    const description = shorten(
      this.transloco.translate('artist.meta.description', {
        headline: profile.headline,
        bio: profile.bio,
      }),
    );
    const photo = profile.photos[0];
    const image = photo && {
      src: this.meta.url(rendition(photo.srcset, PREVIEW_WIDTH) ?? photo.src),
      alt: photo.alt,
    };

    this.meta.set({
      title: this.transloco.translate('artist.meta.title', {
        name: profile.displayName,
        city: profile.baseCity,
      }),
      description,
      path: `/artists/${profile.slug}`,
      type: 'profile',
      image,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': profile.actType === 'solo' ? 'Person' : 'MusicGroup',
        name: profile.displayName,
        url,
        ...(image && { image: image.src }),
        description,
        address: {
          '@type': 'PostalAddress',
          addressLocality: profile.baseCity,
          addressRegion: 'ON',
          addressCountry: 'CA',
        },
        ...(profile.rating !== null &&
          profile.reviewCount > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: profile.rating,
              reviewCount: profile.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }),
      },
    });
  }
}

/** One line of text, cut at the last whole word that fits, with an ellipsis. */
function shorten(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim();
  if (line.length <= DESCRIPTION_MAX_LENGTH) return line;
  const cut = line.slice(0, DESCRIPTION_MAX_LENGTH - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.]+$/, '')}…`;
}

/** The URL of the `{width}w` candidate in a srcset, if there is one. */
function rendition(srcset: string, width: number): string | null {
  const candidate = srcset
    .split(',')
    .map((each) => each.trim().split(/\s+/))
    .find(([, descriptor]) => descriptor === `${width}w`);
  return candidate?.[0] ?? null;
}
