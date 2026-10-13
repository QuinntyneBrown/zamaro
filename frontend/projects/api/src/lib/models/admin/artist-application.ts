import type { ApplicationStatus } from '../artist-onboarding';
import type { ActType, Style } from '../discovery';

/** One row of the applications queue (review-artist-application, pages/admin-applications; L2-067.1). */
export interface AdminApplicationRow {
  id: number;
  /** "A-0219". */
  number: string;
  status: ApplicationStatus;
  name: string;
  actType: ActType;
  /** The town only: "Scarborough". */
  baseCity: string;
  /** When it was sent, Toronto time. */
  submittedAt: string;
}

/** The queue with how many are waiting. */
export interface AdminApplicationQueue {
  applications: AdminApplicationRow[];
  waiting: number;
  /** When the last decision was made, Toronto time, or null before the first. */
  lastDecidedAt: string | null;
}

/** A church reference with its decrypted contact and who ticked it (L2-079.2). */
export interface AdminApplicationReference {
  id: number;
  name: string;
  church: string;
  /** "647 555 0192" or an email address. */
  contact: string;
  verifiedAt: string | null;
  verifiedBy: { name: string } | null;
}

/** An application video as the review screen plays it. */
export interface AdminApplicationVideo {
  id: number;
  title: string;
  status: 'uploading' | 'processing' | 'live' | 'failed';
  durationSeconds: number;
  poster: { src: string; width: number; height: number } | null;
  stream: string | null;
}

/** The applicant's latest Vulnerable Sector Check, when they have an account and uploaded one. */
export interface AdminApplicationCheck {
  id: number;
  status: 'scanning' | 'pending' | 'verified' | 'blocked';
  issuedOn: string;
  expiresOn: string | null;
}

/** The fixed list a rejection picks from (L2-048.2). */
export type ApplicationRejectionReason =
  | 'references-unconfirmed'
  | 'videos-not-worship'
  | 'outside-service-area'
  | 'incomplete-or-inaccurate'
  | 'other';

export const APPLICATION_REJECTION_REASONS: readonly ApplicationRejectionReason[] = [
  'references-unconfirmed',
  'videos-not-worship',
  'outside-service-area',
  'incomplete-or-inaccurate',
  'other',
];

/** The decision, once made. */
export interface AdminApplicationDecision {
  decidedAt: string;
  decidedBy: { name: string } | null;
  rejectionReason: ApplicationRejectionReason | null;
  rejectionNote: string | null;
}

/** The artist an approval created, hidden until payout setup. */
export interface AdminApplicationArtist {
  id: number;
  slug: string;
  ticketNumber: string;
  payoutReady: boolean;
}

/** An application as the administrator reviews it (pages/admin-application). */
export interface AdminApplication {
  id: number;
  number: string;
  status: ApplicationStatus;
  name: string;
  email: string;
  actType: ActType;
  baseCity: string;
  styles: Style[];
  /** Plain text; never render it as HTML. */
  bio: string;
  fromPriceCents: number;
  maxDriveKm: number;
  submittedAt: string;
  videos: AdminApplicationVideo[];
  references: AdminApplicationReference[];
  vulnerableSectorCheck: AdminApplicationCheck | null;
  decision: AdminApplicationDecision | null;
  artist: AdminApplicationArtist | null;
}
