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
}
