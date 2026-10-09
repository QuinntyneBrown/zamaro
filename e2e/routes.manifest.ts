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
];
