// Iterations per scenario, tuned so each renders in roughly 100-300 ms.
// Never lower these, delete a scenario, or loosen a threshold to clear a flag (AGENTS.md).
export const defaultIterations = 200;

/** @type {Record<string, number>} */
export const scenarioIterations = {
  DarkTheme: 60,
  Footer: 100,
  Menu: 90,
  TopBar: 120,
};
