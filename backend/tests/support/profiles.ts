import { api } from './app';

export interface Photo {
  id: string;
  alt: string;
  src: string;
  width: number;
  height: number;
  srcset: string;
  avifSrcset: string;
}

export interface Video {
  id: string;
  title: string;
  durationSeconds: number;
  poster: { src: string; width: number; height: number } | null;
  stream: string;
  captions: { src: string; lang: string } | null;
}

export interface Review {
  id: number;
  stars: number;
  text: string;
  attribution: { reviewerName: string; churchName: string; city: string; month: string };
  reply: { text: string; artistName: string; month: string } | null;
}

export interface Profile {
  data: {
    id: number;
    slug: string;
    displayName: string;
    firstName: string;
    pronoun: string;
    actType: string;
    headline: string;
    aboutHeading: string | null;
    bio: string;
    baseCity: string;
    maxDriveKm: number;
    fromPrice: { cents: number; currency: string };
    ticketNumber: string;
    rating: number | null;
    reviewCount: number;
    styles: string[];
    setlist: { position: number; title: string; writer: string | null; key: string }[];
    photos: Photo[];
    videos: Video[];
    reviews: { total: number; items: Review[]; nextCursor: string | null };
  };
}

export function profile(slug: string, query = ''): Promise<Response> {
  return api(`/api/v1/artists/${slug}${query}`);
}

export async function profileData(slug: string): Promise<Profile['data']> {
  const response = await profile(slug);
  if (response.status !== 200) {
    throw new Error(`profile answered ${String(response.status)}: ${await response.text()}`);
  }
  return ((await response.json()) as Profile).data;
}
