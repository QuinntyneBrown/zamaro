import type { CalendarDate } from '../i18n/calendar-date';
import type { ActType, Style } from './discovery';

export type ApplicationVideoStatus = 'uploading' | 'processing' | 'live' | 'failed';

/** An applicant's video as the upload row shows it (apply-as-artist, ADR-0026). */
export interface ApplicationVideo {
  /** The upload's token: the address of its chunks and what the application names. */
  token: string;
  status: ApplicationVideoStatus;
  title: string;
  fileName: string;
  /** The whole file, in bytes. */
  size: number;
  /** How many bytes have arrived. */
  offset: number;
  /** Once live: the length in seconds. */
  durationSeconds: number | null;
  posterUrl: string | null;
  /** Once failed: what the applicant reads. */
  failureReason: string | null;
}

export interface ApplicationReferenceInput {
  name: string;
  church: string;
  /** A phone number or an email address. */
  contact: string;
}

/** What the apply form sends (L2-047.1). */
export interface ArtistApplicationInput {
  name: string;
  email: string;
  baseCity: string;
  actType: ActType;
  styles: Style[];
  bio: string;
  /** Whole dollars per service. */
  fromPrice: number;
  maxDriveKm: number;
  /** Upload tokens, in the order the videos should show. */
  videos: string[];
  references: [ApplicationReferenceInput, ApplicationReferenceInput];
  challengeToken: string;
}

export type ApplicationStatus = 'submitted' | 'approved' | 'rejected';

/** The application as its applicant sees it: references are named, never their contacts. */
export interface ArtistApplication {
  id: number;
  /** "A-0219". */
  number: string;
  status: ApplicationStatus;
  name: string;
  email: string;
  /** When it was sent, Toronto time, ISO 8601. */
  submittedAt: string;
  /** `YYYY-MM-DD`: 3 business days after it was sent. */
  replyBy: CalendarDate;
  /** The statutory holidays those days skipped. */
  skippedHolidays: { date: CalendarDate; name: string }[];
  videos: { token: string; title: string; status: ApplicationVideoStatus }[];
  references: { name: string; church: string }[];
}
