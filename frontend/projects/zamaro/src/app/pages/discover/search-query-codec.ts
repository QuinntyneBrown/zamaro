import type { ParamMap, Params } from '@angular/router';
import {
  GATHERING_KINDS,
  type GatheringKind,
  RADII_KM,
  type RadiusKm,
  SEARCH_SORTS,
  type SearchQuery,
  type SearchSort,
  STYLES,
  type Style,
} from 'api';

/** Everything Discover keeps in the address bar (L2-009). */
export interface SearchState {
  /** `YYYY-MM-DD`, or empty before a date is chosen. */
  date: string;
  kind: GatheringKind;
  lat: number | null;
  lng: number | null;
  /** The town the coordinates stand for, as the location field shows it. */
  place: string;
  radius: RadiusKm;
  sort: SearchSort;
  styles: Style[];
  under800: boolean;
}

export const DEFAULT_STATE: SearchState = {
  date: '',
  kind: 'sunday-service',
  lat: null,
  lng: null,
  place: '',
  radius: 120,
  sort: 'closest',
  styles: [],
  under800: false,
};

const UNDER_800 = 'under-800';
const MAX_PLACE_LENGTH = 100;

/**
 * Reads each parameter on its own: an invalid one falls back to its default and the rest still
 * apply (`radius=999` becomes 120).
 */
export function fromParams(params: ParamMap): SearchState {
  const date = params.get('date') ?? '';
  const kind = params.get('kind') as GatheringKind;
  const lat = coordinate(params.get('lat'), 90);
  const lng = coordinate(params.get('lng'), 180);
  const radius = Number(params.get('radius')) as RadiusKm;
  const sort = params.get('sort') as SearchSort;
  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : '',
    kind: GATHERING_KINDS.includes(kind) ? kind : DEFAULT_STATE.kind,
    lat: lat !== null && lng !== null ? lat : null,
    lng: lat !== null && lng !== null ? lng : null,
    place: (params.get('place') ?? '').trim().slice(0, MAX_PLACE_LENGTH),
    radius: RADII_KM.includes(radius) ? radius : DEFAULT_STATE.radius,
    sort: SEARCH_SORTS.includes(sort) ? sort : DEFAULT_STATE.sort,
    styles: STYLES.filter((style) => (params.get('styles') ?? '').split(',').includes(style)),
    under800: params.get('price') === UNDER_800,
  };
}

/**
 * The query parameters for a state. Coordinates are rounded to 3 decimal places and the location is
 * a town label, so a link never carries a street address (L2-009.4). Defaults are left out.
 */
export function toParams(state: SearchState): Params {
  const params: Params = {
    date: state.date,
    kind: state.kind,
    lat: round(state.lat),
    lng: round(state.lng),
    place: state.place,
    radius: state.radius,
  };
  if (state.sort !== DEFAULT_STATE.sort) params['sort'] = state.sort;
  if (state.styles.length) params['styles'] = state.styles.join(',');
  if (state.under800) params['price'] = UNDER_800;
  return params;
}

/** The API query when the state is complete enough to search; otherwise null. */
export function toQuery(state: SearchState): SearchQuery | null {
  if (!state.date || state.lat === null || state.lng === null) return null;
  return {
    date: state.date,
    kind: state.kind,
    lat: state.lat,
    lng: state.lng,
    radius: state.radius,
    sort: state.sort,
    styles: state.styles,
    under800: state.under800,
  };
}

function coordinate(value: string | null, limit: number): number | null {
  const number = Number(value);
  return value !== null && value !== '' && Number.isFinite(number) && Math.abs(number) <= limit
    ? number
    : null;
}

function round(value: number | null): number | null {
  return value === null ? null : Math.round(value * 1000) / 1000;
}
