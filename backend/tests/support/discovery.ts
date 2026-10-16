import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists } from '@/server/db/schema';
import type { FakeRoutingProvider } from '@/server/integrations/routing/fake-routing-provider';
import { routingProvider } from '@/server/integrations/bindings';
import { api } from './app';

/** Burlington, as the Discover quick-pick chip sends it. */
export const BURLINGTON = { lat: 43.325, lng: -79.799 };

export const REFERENCE_SEARCH = {
  date: '2026-11-14',
  kind: 'worship-night',
  lat: BURLINGTON.lat,
  lng: BURLINGTON.lng,
  radius: 120,
};

export interface LineupCard {
  id: number;
  slug: string;
  pronoun: string;
  name: string;
  actType: string;
  styles: string[];
  city: string;
  distance: { km: number; driveMinutes: number; approximate: boolean };
  rating: number | null;
  reviewCount: number;
  fromPrice: { cents: number; currency: string };
}

export interface Lineup {
  data: LineupCard[];
  headliner:
    | (LineupCard & {
        season: string;
        quote: { text: string; reviewerName: string; city: string } | null;
      })
    | null;
  meta: {
    total: number;
    perPage: number;
    nextCursor: string | null;
    sort: string;
    styles: string[];
    price: string | null;
  };
}

/** A search with the reference parameters, overridden per test; `null` drops a parameter. */
export function search(
  overrides: Record<string, string | number | null | undefined> = {},
): Promise<Response> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...REFERENCE_SEARCH, ...overrides })) {
    if (value !== null && value !== undefined) params.set(key, String(value));
  }
  return api(`/api/v1/search?${params.toString()}`);
}

export async function lineup(
  overrides: Record<string, string | number | null | undefined> = {},
): Promise<Lineup> {
  const response = await search(overrides);
  if (response.status !== 200) {
    throw new Error(`search answered ${String(response.status)}: ${await response.text()}`);
  }
  return (await response.json()) as Lineup;
}

/** Everyone in the lineup in order: the headliner, then the tickets. */
export function lineupNames(page: Lineup): string[] {
  return [page.headliner?.name, ...page.data.map((card) => card.name)].filter(
    (name): name is string => name !== undefined,
  );
}

export function routing(): FakeRoutingProvider {
  return routingProvider() as FakeRoutingProvider;
}

export async function artistId(slug: string): Promise<number> {
  const [artist] = await db()
    .select({ id: artists.id })
    .from(artists)
    .where(eq(artists.slug, slug));
  if (artist === undefined) throw new Error(`${slug} is not seeded.`);
  return artist.id;
}
