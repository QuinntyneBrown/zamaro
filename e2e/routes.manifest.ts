import type { CastMember } from './fixtures/accounts';

/**
 * How a state that the seeded API cannot produce on its own is reached. The browser's requests are
 * held or answered in Playwright and never reach the API (adapt-layout-to-screens).
 * - `search-pending`: the search never answers, so the lineup shows its skeletons.
 * - `search-fails`: the search fails as if the network dropped.
 * - `search-limited`: the search is refused as over the rate limit.
 * - `profile-pending` and `profile-fails`: the profile is opened from `from` in the browser, since
 *   the server renders a profile it can reach, and its request never answers or fails.
 */
export type RouteSetup =
  'search-pending' | 'search-fails' | 'search-limited' | 'profile-pending' | 'profile-fails';

export interface RouteState {
  /** Names the state in screenshots and test titles. */
  name: string;
  /** Path and query, relative to the application base URL. */
  path: string;
  /** Which application serves it. */
  app: 'zamaro' | 'admin';
  /** Mock file in docs/mocks/pages this state is compared with. */
  mock: string;
  setup?: RouteSetup;
  /** The page whose link leads to `path`, for states reached in the browser. */
  from?: string;
  /** The cast member whose session the browser holds; signed out when absent. */
  signedInAs?: CastMember;
  /**
   * What the page must show before it is captured, when the browser may still be fetching it after
   * the network went quiet: the lineup's cards, or the sold-out panel.
   */
  shows?: 'lineup' | 'sold-out';
  /** Copy that will change with a later slice, masked in captures: the session-ended line (M5 drafts). */
  masks?: 'session-ended-line';
}

/** Naomi's search: Burlington, Sat 14 Nov, a worship night, within 120 km (docs/mocks/README.md). */
const BURLINGTON =
  '/?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&place=Burlington&radius=120';

// Every route in every state; the visual, a11y and perf suites all read this list.
// Each slice appends its own routes.
export const routes: RouteState[] = [
  // Discover before a search: the poster asks for a date. The closest mock is the invalid state
  // without its field errors.
  { name: 'discover-start', path: '/', app: 'zamaro', mock: 'discover/invalid.html' },
  // Naomi's search: the headliner and six tickets, Closest first.
  {
    name: 'discover-results',
    path: BURLINGTON,
    app: 'zamaro',
    mock: 'discover/default.html',
    shows: 'lineup',
  },
  // The same search while it takes longer than 300 ms: skeletons in a busy region.
  {
    name: 'discover-loading',
    path: BURLINGTON,
    app: 'zamaro',
    mock: 'discover/loading.html',
    setup: 'search-pending',
  },
  // The search failed: "We lost the signal", with Try again.
  {
    name: 'discover-error',
    path: BURLINGTON,
    app: 'zamaro',
    mock: 'discover/error.html',
    setup: 'search-fails',
  },
  // Too many searches: the alert counts down from Retry-After.
  {
    name: 'discover-limited',
    path: BURLINGTON,
    app: 'zamaro',
    mock: 'discover/limited.html',
    setup: 'search-limited',
  },
  // Christmas Eve, gospel choirs within 40 km: nobody is free, with nearby dates and a wider radius.
  {
    name: 'discover-sold-out',
    path: '/?date=2026-12-24&kind=worship-night&lat=43.325&lng=-79.799&place=Burlington&radius=40&styles=gospel-choir',
    app: 'zamaro',
    mock: 'discover/empty.html',
    shows: 'sold-out',
  },
  // Abigail’s profile opened from that search: videos, photos, her dates from Sat 14 Nov, reviews and
  // the booking stub. The booked-date mock needs a typed date, so it has no route state of its own.
  {
    name: 'artist-default',
    path: '/artists/abigail-mensah?date=2026-11-14',
    app: 'zamaro',
    mock: 'artist/default.html',
  },
  // Miriam, new to Zamaro, opened without a date: "Check dates", six free dates from Mon 12 Oct,
  // no videos and "No church reviews yet".
  { name: 'artist-empty', path: '/artists/miriam-haile', app: 'zamaro', mock: 'artist/empty.html' },
  // A band with no photos or videos: the act-type illustration and "No videos yet".
  {
    name: 'artist-no-photos',
    path: '/artists/marcus-bell-trio',
    app: 'zamaro',
    mock: 'artist/no-photos.html',
  },
  // Abigail's profile opened from the lineup while it loads: the busy region.
  {
    name: 'artist-loading',
    path: '/artists/abigail-mensah?date=2026-11-14',
    app: 'zamaro',
    mock: 'artist/loading.html',
    setup: 'profile-pending',
    from: BURLINGTON,
  },
  // The profile request failed: Try again and Back to the lineup.
  {
    name: 'artist-error',
    path: '/artists/abigail-mensah?date=2026-11-14',
    app: 'zamaro',
    mock: 'artist/error.html',
    setup: 'profile-fails',
    from: BURLINGTON,
  },
  // Selah Brooks is suspended: the missing-artist 404 with solo vocalists free Sat 14 Nov. Opened
  // without a search, they are measured from Toronto, so the names and distances differ from the
  // mock's Burlington search.
  {
    name: 'not-found-artist',
    path: '/artists/selah-brooks?date=2026-11-14',
    app: 'zamaro',
    mock: 'not-found/artist.html',
  },
  // Any address that is no page: "No show", served with a 404.
  { name: 'not-found', path: '/no-such-page', app: 'zamaro', mock: 'not-found/default.html' },
  // Sign in: the "Admit one · Your account" card on the stage, with "Create account" in the header
  // and "Create an account" on the card. "Forgot your password?" joins with its page (M2 S8).
  { name: 'sign-in', path: '/sign-in', app: 'zamaro', mock: 'sign-in/default.html' },
  // Sign up: the "Admit one · New account" card with the required terms box and the separate,
  // unticked news box.
  { name: 'sign-up', path: '/sign-up', app: 'zamaro', mock: 'sign-up/default.html' },
  // A session that ended: "Your session ended" above the fields. Opened directly, the email is empty
  // (the app fills it in when it sends the person here). The line names the kept draft from M5.
  {
    name: 'sign-in-ended',
    path: '/sign-in?ended=1',
    app: 'zamaro',
    mock: 'sign-in/expired.html',
    masks: 'session-ended-line',
  },
  // Naomi signed in, before a search: "NF" in the header and her name over the footer's last column.
  // Saved and the hearts join with M2 S15, her church with S9.
  {
    name: 'discover-start-naomi',
    path: '/',
    app: 'zamaro',
    mock: 'discover/invalid.html',
    signedInAs: 'naomi',
  },
  // Naomi's search, signed in.
  {
    name: 'discover-results-naomi',
    path: BURLINGTON,
    app: 'zamaro',
    mock: 'discover/default.html',
    signedInAs: 'naomi',
    shows: 'lineup',
  },
];
