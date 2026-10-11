// Iterations per scenario, tuned so each renders in roughly 100-300 ms.
// Never lower these, delete a scenario, or loosen a threshold to clear a flag (AGENTS.md).
export const defaultIterations = 200;

/** @type {Record<string, number>} */
export const scenarioIterations = {
  BookingStub: 150,
  DarkTheme: 60,
  Footer: 100,
  Lineup: 25,
  LineupSaved: 18,
  Menu: 90,
  SavedLineup: 1,
  Stamp: 240,
  TopBar: 120,
  TopBarSignedIn: 110,
};
