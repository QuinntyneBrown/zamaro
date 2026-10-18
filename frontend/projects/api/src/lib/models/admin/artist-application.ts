import type { CalendarDate } from '../../i18n/calendar-date';
import type { ApplicationStatus } from '../artist-onboarding';

/** Why an application was rejected: the fixed list of L2-048.2. */
export type ApplicationRejectionReason =
  | 'references-unconfirmed'
  | 'videos-not-leading-worship'
  | 'outside-service-area'
  | 'incomplete-or-inaccurate'
  | 'other';

/** A row of the application queue (review-artist-application, pages/admin-applications). */
export interface AdminApplicationRow {
  id: number;
  /** The applicant-facing number, such as `A-0219`. */
  number: string;
  name: string;
  actType: 'solo' | 'duo' | 'band' | 'choir';
  baseCity: string;
  /** When it was submitted, Toronto time, ISO 8601. */
  submittedAt: string;
}

/** The queue: the Submitted applications, oldest first, and how many. */
export interface AdminApplicationQueue {
  applications: AdminApplicationRow[];
  waiting: number;
}

/** A church reference, its contact decrypted for the administrator who calls them (L2-079.2). */
export interface AdminApplicationReference {
  id: number;
  name: string;
  church: string;
  contact: string;
  verifiedAt: string | null;
  verifiedBy: { name: string } | null;
}

export interface AdminApplicationVideo {
  id: string;
  title: string;
  status: 'uploading' | 'processing' | 'live' | 'failed';
  durationSeconds: number | null;
  /** The poster frame, or null to keep the halftone placeholder. */
  poster: { src: string; width: number; height: number } | null;
  /** The HLS manifest once the video is Live. */
  stream: string | null;
}

/** The review screen (pages/admin-application): every detail the administrator needs to decide. */
export interface AdminApplication extends AdminApplicationRow {
  status: ApplicationStatus;
  email: string;
  styles: string[];
  fromPriceCents: number;
  maxDriveKm: number;
  bio: string;
  references: AdminApplicationReference[];
  videos: AdminApplicationVideo[];
  decidedAt: string | null;
  decidedBy: { name: string } | null;
  /** The reason and note of a rejection; null unless Rejected. */
  rejection: { reason: ApplicationRejectionReason; note: string | null } | null;
  /** The applicant's latest Vulnerable Sector Check, or null when none is uploaded. */
  vsc: { id: number; issuedOn: CalendarDate; status: string } | null;
}
