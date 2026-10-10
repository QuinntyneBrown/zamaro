import type { ActType, Money, Style } from './discovery';

/** A setlist song's key: `E`, `B-flat`, `F-sharp-minor`, or `any`. */
export type MusicalKey = string;

export interface SetlistSong {
  position: number;
  title: string;
  /** The writer or source: "Sinach", "Traditional Ghanaian". */
  writer: string | null;
  key: MusicalKey;
}

/** A gallery photo (L2-015). URLs point at the media host. */
export interface ProfilePhoto {
  id: string;
  /** The artist's alt text: "Abigail at the microphone during a Sunday service". */
  alt: string;
  /** The 800 px WebP; `width` and `height` are its intrinsic size. */
  src: string;
  width: number;
  height: number;
  /** WebP renditions with width descriptors (400, 800, 1200 and 1600 px). */
  srcset: string;
  /** The same widths in AVIF. */
  avifSrcset: string;
}

/** A live video (L2-014); processing ones never reach the public profile. */
export interface ProfileVideo {
  id: string;
  /** Song and setting: "Way Maker — live at Bethel Pentecostal, Hamilton". */
  title: string;
  durationSeconds: number;
  /** The poster frame, or null to keep the halftone placeholder. */
  poster: { src: string; width: number; height: number } | null;
  /** The HLS manifest. */
  stream: string;
  /** The artist's WebVTT captions, or null when they supplied none. */
  captions: { src: string; lang: string } | null;
}

/** `GET /api/v1/artists/{slug}`: public fields only (L2-083). */
export interface ArtistProfile {
  slug: string;
  displayName: string;
  /** A solo act's first name, or a group's whole name: "Songs Abigail leads". */
  firstName: string;
  pronoun: 'she' | 'he' | 'they';
  actType: ActType;
  headline: string;
  /** Null when the artist has not set one: show "About {firstName}". */
  aboutHeading: string | null;
  /** Plain text; paragraphs are separated by a blank line. Never render it as HTML. */
  bio: string;
  /** The city only: "Brampton". */
  baseCity: string;
  maxDriveKm: number;
  fromPrice: Money;
  ticketNumber: string;
  /** Out of 5, one decimal; null before the first review. */
  rating: number | null;
  reviewCount: number;
  styles: Style[];
  setlist: SetlistSong[];
  /** In the artist's order; empty shows the act-type illustration (L2-020.3). */
  photos: ProfilePhoto[];
  videos: ProfileVideo[];
}
