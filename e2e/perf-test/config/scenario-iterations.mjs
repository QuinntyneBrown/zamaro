// Iterations per scenario, tuned so each renders in roughly 100-300 ms.
// Never lower these, delete a scenario, or loosen a threshold to clear a flag (AGENTS.md).
export const defaultIterations = 200;

/** @type {Record<string, number>} */
export const scenarioIterations = {
  DarkTheme: 60,
  DateSwap: 400,
  ErrorSummary: 450,
  Footer: 100,
  HeadlinerSkeleton: 500,
  Lineup: 25,
  Menu: 90,
  TicketSkeleton: 400,
  TopBar: 120,
};
