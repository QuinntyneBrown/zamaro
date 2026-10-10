export interface RouteState {
  /** Path and query, relative to the application base URL. */
  path: string;
  /** Which application serves it. */
  app: 'zamaro' | 'admin';
  /** Mock file in docs/mocks/pages this state is compared with. */
  mock: string;
}

// Every route in every state; the visual, a11y and perf suites all read this list.
// Each slice appends its own routes.
export const routes: RouteState[] = [
  // Discover before a search: the poster asks for a date. The closest mock is the invalid state
  // without its field errors; S5 adds the search form and the searched states.
  { path: '/', app: 'zamaro', mock: 'discover/invalid.html' },
  // Naomi's search: the headliner and six tickets, Closest first.
  {
    path: '/?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&place=Burlington&radius=120',
    app: 'zamaro',
    mock: 'discover/default.html',
  },
  // Abigail’s profile opened from that search: videos, photos, her dates from Sat 14 Nov, reviews and
  // the booking stub. The booked-date mock needs a typed date, so it has no route state of its own.
  {
    path: '/artists/abigail-mensah?date=2026-11-14',
    app: 'zamaro',
    mock: 'artist/default.html',
  },
  // Miriam, new to Zamaro, opened without a date: "Check dates", six free dates from Mon 12 Oct and
  // "No church reviews yet".
  { path: '/artists/miriam-haile', app: 'zamaro', mock: 'artist/empty.html' },
  // A band with no photos or videos: the act-type illustration and "No videos yet".
  { path: '/artists/marcus-bell-trio', app: 'zamaro', mock: 'artist/no-photos.html' },
  // Selah Brooks is suspended: the missing-artist 404 with solo vocalists free Sat 14 Nov. Opened
  // without a search, they are measured from Toronto, so the names and distances differ from the
  // mock's Burlington search.
  {
    path: '/artists/selah-brooks?date=2026-11-14',
    app: 'zamaro',
    mock: 'not-found/artist.html',
  },
  // Any address that is no page: "No show", served with a 404.
  { path: '/no-such-page', app: 'zamaro', mock: 'not-found/default.html' },
];
