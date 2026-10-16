import type { DateTime } from 'luxon';
import { RADII_KM } from '@/server/http/requests/discovery/search-artists';
import { freeArtistIds } from '@/server/services/artist-availability/availability';
import {
  earliestBookable,
  latestBookable,
} from '@/server/services/artist-availability/booking-window';
import { measuredCandidates } from '@/server/services/discovery/candidate-finder';
import { travels, type LineupCard, type SearchCriteria } from '@/server/services/discovery/lineup';

/**
 * Ways forward when nobody is free (L2-011): up to three dates within 7 days either side on which
 * someone is free under the current filters, closest first (the earlier of two equally far), and
 * the smallest wider radius with matches on the searched date.
 */
const DAYS_EITHER_SIDE = 7;
const MAX_DATES = 3;

export interface SearchAlternatives {
  nearbyDates: { date: string; count: number }[];
  widerRadius: { km: number; count: number } | null;
  filtersApplied: boolean;
}

export async function findSearchAlternatives(
  criteria: SearchCriteria,
): Promise<SearchAlternatives> {
  const wider = RADII_KM.filter((km) => km > criteria.radiusKm);
  const candidates = await measuredCandidates(
    criteria,
    wider.length === 0 ? criteria.radiusKm : Math.max(...wider),
  );
  return {
    nearbyDates: await nearbyDates(criteria, candidates),
    widerRadius: await widerRadius(criteria, candidates, wider),
    filtersApplied: criteria.filter.styles.length > 0 || criteria.filter.under800,
  };
}

async function nearbyDates(
  criteria: SearchCriteria,
  candidates: Map<number, LineupCard>,
): Promise<{ date: string; count: number }[]> {
  const earliest = earliestBookable();
  const latest = latestBookable();
  const offsets: number[] = [];
  for (let days = 1; days <= DAYS_EITHER_SIDE; days++) offsets.push(-days, days);

  const dates: { date: string; count: number }[] = [];
  for (const offset of offsets) {
    const date = criteria.eventDate.plus({ days: offset });
    if (date < earliest || date > latest) continue;
    const count = await countFree(candidates, date, criteria, criteria.radiusKm);
    if (count > 0) dates.push({ date: date.toISODate() ?? '', count });
    if (dates.length === MAX_DATES) break;
  }
  return dates;
}

async function widerRadius(
  criteria: SearchCriteria,
  candidates: Map<number, LineupCard>,
  wider: number[],
): Promise<{ km: number; count: number } | null> {
  for (const km of wider) {
    const count = await countFree(candidates, criteria.eventDate, criteria, km);
    if (count > 0) return { km, count };
  }
  return null;
}

async function countFree(
  candidates: Map<number, LineupCard>,
  date: DateTime,
  criteria: SearchCriteria,
  radiusKm: number,
): Promise<number> {
  const free = await freeArtistIds([...candidates.keys()], date, criteria.kind);
  return free.filter((id) => {
    const card = candidates.get(id);
    return card !== undefined && travels(card, radiusKm);
  }).length;
}
