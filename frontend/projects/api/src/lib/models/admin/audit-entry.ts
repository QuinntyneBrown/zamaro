import type { Role } from '../accounts';

/** One row of the audit log as the admin viewer shows it (administration/record-audit-log). */
export interface AuditEntry {
  id: number;
  /** When it happened, Toronto time, ISO 8601. */
  occurredAt: string;
  /** Who did it; null for the system (no address) or an unknown sign-in (an attempted email). */
  actor: { name: string; email: string; role: Role | null } | null;
  /** The email a failed sign-in tried, when it belongs to no account. */
  attemptedEmail: string | null;
  /** The action code: `auth.sign_in_failed`. */
  action: string;
  /** What it acted on; null when nothing. */
  target: { type: string; label: string | null } | null;
  /** The client's address, or null for a queued job. */
  ipAddress: string | null;
  outcome: AuditOutcome;
}

export type AuditOutcome = 'succeeded' | 'failed' | 'denied';

/** The audit log's filters; empty strings and nulls mean "any". */
export interface AuditFilters {
  actor?: string | null;
  action?: string | null;
  target?: string | null;
  outcome?: AuditOutcome | '' | null;
  /** `YYYY-MM-DD`, Toronto time, inclusive. */
  from?: string | null;
  to?: string | null;
}

/** One page of the log, newest first, with the cursor for older entries. */
export interface AuditEntryPage {
  entries: AuditEntry[];
  perPage: number;
  nextCursor: string | null;
}
