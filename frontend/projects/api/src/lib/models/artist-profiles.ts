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

/** An image in WebP widths from the media domain (L2-088). */
export interface MediaImage {
  /** The 800 px rendition. */
  src: string;
  /** Every width, with width descriptors: "…-400.webp 400w, …-800.webp 800w, …". */
  srcset: string;
  /** Intrinsic size of `src`. */
  width: number;
  height: number;
}

/** A gallery photo (L2-015), in the artist's order, with the alt text the artist wrote. */
export interface ProfilePhoto extends MediaImage {
  id: string;
  alt: string;
  /** AVIF widths; null until uploads produce them (M4). */
  avifSrcset: string | null;
}

/** A live video (L2-014): processing and failed videos never reach the public profile. */
export interface ProfileVideo {
  id: string;
  /** Song and setting: "Way Maker — live at Bethel Pentecostal, Hamilton". */
  title: string;
  durationSeconds: number;
  /** The HLS manifest of the adaptive renditions. */
  stream: string;
  /** The poster frame, or null when there is none yet. */
  poster: MediaImage | null;
  /** The artist's WebVTT captions, or null when they supplied none. */
  captions: { src: string; language: string } | null;
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
  /** Up to 12, in the artist's order. */
  photos: ProfilePhoto[];
  /** Up to 8 live videos, in the artist's order. */
  videos: ProfileVideo[];
}
