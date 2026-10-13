import type { CalendarDate } from '../../i18n/calendar-date';

export type VscStatus = 'scanning' | 'pending' | 'verified' | 'blocked';

/** A check in the admin queue (verify-vulnerable-sector-check, pages/admin-checks): never the document itself. */
export interface AdminVulnerableSectorCheck {
  id: number;
  /** Whose check; the account's name when the person has no artist profile yet. */
  artist: { id: number | null; name: string; slug: string | null };
  status: VscStatus;
  /** `YYYY-MM-DD`, as printed on the check. */
  issuedOn: CalendarDate;
  /** When it was uploaded, Toronto time, ISO 8601. */
  uploadedAt: string;
  /** `YYYY-MM-DD` once verified, 3 years from the issue date. */
  expiresOn: CalendarDate | null;
  verifiedAt: string | null;
  verifiedBy: { name: string } | null;
  /** The artist's verified check this one replaces, or null for a first check. */
  replaces: { verifiedUntil: CalendarDate } | null;
}

/** The queue: the checks waiting, oldest upload first, and how many. */
export interface AdminVulnerableSectorCheckQueue {
  checks: AdminVulnerableSectorCheck[];
  waiting: number;
}

/** A signed link to a check's document on the media host, good for 5 minutes (L2-049.4). */
export interface DocumentLink {
  url: string;
  expiresAt: string;
}
