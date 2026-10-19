// Iterations per scenario, tuned so each renders in roughly 100-300 ms.
// Never lower these, delete a scenario, or loosen a threshold to clear a flag (AGENTS.md).
export const defaultIterations = 200;

/** @type {Record<string, number>} */
export const scenarioIterations = {
  AuditLogTable: 12,
  BookingStub: 150,
  BulkBar: 1200,
  CalendarMonth: 60,
  CalendarMonthDark: 60,
  DarkTheme: 60,
  DateSwap: 400,
  ErrorSummary: 450,
  Footer: 100,
  FormField: 300,
  HeadlinerSkeleton: 500,
  Lineup: 25,
  LineupSaved: 18,
  Menu: 90,
  SavedLineup: 1,
  Stamp: 240,
  Table: 120,
  TicketSkeleton: 400,
  TopBar: 120,
  TopBarSignedIn: 110,
  TopBarWorkspace: 100,
  TourDatesSchedule: 150,
};
