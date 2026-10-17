import type { AlertSeverity } from '@/server/enums';

/** One alert for the on-call person: a stable key to group repeats by, and a line a person can act on. */
export interface Alert {
  key: string;
  summary: string;
  severity: AlertSeverity;
  context: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Raises an alert to the on-call person directly, for failures that metrics alone would miss, such
 * as a job that exhausted its retries (L2-092.1, L2-093.3). The vendor is chosen in M10; until then
 * the fake is bound (ADR-0002).
 */
export interface OnCallAlerter {
  raise(alert: Alert): void;
}
