// Closed vocabularies (ADR-0027): string-literal unions exported as `as const` objects, stored as
// Postgres enums (src/server/db/schema/enums.ts). Values are the URL and API spellings.

export const ActType = { Solo: 'solo', Duo: 'duo', Band: 'band', Choir: 'choir' } as const;
export type ActType = (typeof ActType)[keyof typeof ActType];

export const ArtistStatus = {
  Approved: 'approved',
  Suspended: 'suspended',
  Deleted: 'deleted',
} as const;
export type ArtistStatus = (typeof ArtistStatus)[keyof typeof ArtistStatus];

/** Musical styles an artist offers; values are the URL slugs (L2-008), in the chips' order. */
export const Style = {
  Band: 'band',
  SoloVocalist: 'solo-vocalist',
  GospelChoir: 'gospel-choir',
  Acoustic: 'acoustic',
  Hymns: 'hymns',
  Spanish: 'spanish',
} as const;
export type Style = (typeof Style)[keyof typeof Style];

/** How profile copy refers to the artist; a group act is always They. */
export const Pronoun = { She: 'she', He: 'he', They: 'they' } as const;
export type Pronoun = (typeof Pronoun)[keyof typeof Pronoun];

/** The key a setlist song is led in (L2-016): 12 major, 12 minor, or any key. */
export const MusicalKey = {
  C: 'C',
  DFlat: 'D-flat',
  D: 'D',
  EFlat: 'E-flat',
  E: 'E',
  F: 'F',
  FSharp: 'F-sharp',
  G: 'G',
  AFlat: 'A-flat',
  A: 'A',
  BFlat: 'B-flat',
  B: 'B',
  CMinor: 'C-minor',
  CSharpMinor: 'C-sharp-minor',
  DMinor: 'D-minor',
  EFlatMinor: 'E-flat-minor',
  EMinor: 'E-minor',
  FMinor: 'F-minor',
  FSharpMinor: 'F-sharp-minor',
  GMinor: 'G-minor',
  GSharpMinor: 'G-sharp-minor',
  AMinor: 'A-minor',
  BFlatMinor: 'B-flat-minor',
  BMinor: 'B-minor',
  AnyKey: 'any',
} as const;
export type MusicalKey = (typeof MusicalKey)[keyof typeof MusicalKey];

/** An upload's progress (L2-052.2). Only Live videos are shown publicly (L2-014.3). */
export const VideoStatus = {
  Uploading: 'uploading',
  Processing: 'processing',
  Live: 'live',
  Failed: 'failed',
} as const;
export type VideoStatus = (typeof VideoStatus)[keyof typeof VideoStatus];

/** A dated exception to an artist's weekly availability. */
export const OverrideState = { Free: 'free', Unavailable: 'unavailable' } as const;
export type OverrideState = (typeof OverrideState)[keyof typeof OverrideState];

/** A date in an artist's "On tour" list (L2-017): free to book, or taken by a Confirmed booking. */
export const TourDateStatus = { Free: 'free', Booked: 'booked' } as const;
export type TourDateStatus = (typeof TourDateStatus)[keyof typeof TourDateStatus];

export const BookingStatus = {
  Requested: 'requested',
  Accepted: 'accepted',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Declined: 'declined',
  Withdrawn: 'withdrawn',
  Expired: 'expired',
  Cancelled: 'cancelled',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** The kind of gathering a booker searches for (L2-004); values are the URL slugs. */
export const GatheringKind = {
  SundayService: 'sunday-service',
  WorshipNight: 'worship-night',
  YouthEvent: 'youth-event',
  ConferenceOrRetreat: 'conference-or-retreat',
  Wedding: 'wedding',
  FuneralOrMemorial: 'funeral-or-memorial',
} as const;
export type GatheringKind = (typeof GatheringKind)[keyof typeof GatheringKind];

/** How the lineup's tickets are ordered (L2-007); values are the URL spellings. */
export const SearchSort = {
  Closest: 'closest',
  HighestRated: 'rating',
  PriceLowToHigh: 'price',
} as const;
export type SearchSort = (typeof SearchSort)[keyof typeof SearchSort];

/** What a person may do on Zamaro; a route guarded by a role answers 404 to anyone without it. */
export const Role = { Booker: 'booker', Artist: 'artist', Administrator: 'admin' } as const;
export type Role = (typeof Role)[keyof typeof Role];

/** A theme chosen with the toggle (L2-104); none means the device decides. */
export const ThemePreference = { Light: 'light', Dark: 'dark' } as const;
export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference];

/** What a consent record is about (privacy/record-consent). Legal documents are the first two. */
export const ConsentKind = {
  Terms: 'terms',
  PrivacyPolicy: 'privacy-policy',
  MarketingEmail: 'marketing-email',
} as const;
export type ConsentKind = (typeof ConsentKind)[keyof typeof ConsentKind];

/** Where a consent record was given: the sign-up form, the updated-terms page or account settings. */
export const ConsentSource = {
  Registration: 'registration',
  TermsUpdate: 'terms-update',
  Settings: 'settings',
} as const;
export type ConsentSource = (typeof ConsentSource)[keyof typeof ConsentSource];

/** Vulnerable Sector Check review state (L2-049). */
export const VscStatus = {
  Scanning: 'scanning',
  Pending: 'pending',
  Verified: 'verified',
  Blocked: 'blocked',
} as const;
export type VscStatus = (typeof VscStatus)[keyof typeof VscStatus];

/** What an upload is for, which decides the types it may be (scan-and-serve-uploads). */
export const UploadPurpose = {
  VscDocument: 'vsc_document',
  Photo: 'photo',
  Video: 'video',
  Caption: 'caption',
} as const;
export type UploadPurpose = (typeof UploadPurpose)[keyof typeof UploadPurpose];

/** Where an upload stands: in quarantine until the scan, then clean, or rejected and deleted. */
export const UploadStatus = {
  Quarantined: 'quarantined',
  Clean: 'clean',
  Rejected: 'rejected',
} as const;
export type UploadStatus = (typeof UploadStatus)[keyof typeof UploadStatus];

/** What the malware scanner says about a file. `Error` means it could not say, and the job retries. */
export const ScanVerdict = { Clean: 'clean', Infected: 'infected', Error: 'error' } as const;
export type ScanVerdict = (typeof ScanVerdict)[keyof typeof ScanVerdict];

/** Where an artist application stands (L2-047, L2-048). */
export const ApplicationStatus = {
  Submitted: 'submitted',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

/** Why an application was rejected: the fixed list of L2-048.2, as the applicant reads it. */
export const ApplicationRejectionReason = {
  ReferencesUnconfirmed: 'references-unconfirmed',
  VideosNotLeadingWorship: 'videos-not-leading-worship',
  OutsideServiceArea: 'outside-service-area',
  IncompleteOrInaccurate: 'incomplete-or-inaccurate',
  Other: 'other',
} as const;
export type ApplicationRejectionReason =
  (typeof ApplicationRejectionReason)[keyof typeof ApplicationRejectionReason];

export const APPLICATION_REJECTION_REASON_LABELS: Record<ApplicationRejectionReason, string> = {
  'references-unconfirmed': 'References could not be confirmed',
  'videos-not-leading-worship': "Videos don't show you leading worship",
  'outside-service-area': 'Outside the Zamaro service area',
  'incomplete-or-inaccurate': 'Application incomplete or inaccurate',
  other: 'Other',
};

/** Every audited action (administration/record-audit-log); the list grows with each slice. */
export const AuditAction = {
  SignIn: 'auth.sign_in',
  SignInFailed: 'auth.sign_in_failed',
  PasswordReset: 'auth.password_reset',
  PasswordChanged: 'auth.password_changed',
  EmailChanged: 'account.email_changed',
  TwoFactorEnabled: 'auth.two_factor_enabled',
  TwoFactorDisabled: 'auth.two_factor_disabled',
  RecoveryCodesReplaced: 'auth.recovery_codes_replaced',
  MfaChallenge: 'auth.mfa_challenge',
  RoleChanged: 'user.role_changed',
  VscDocumentViewed: 'vsc_document.viewed',
  VscVerified: 'vsc.verified',
  ApplicationViewed: 'application.viewed',
  ReferenceVerified: 'application_reference.verified',
  ApplicationApproved: 'application.approved',
  ApplicationRejected: 'application.rejected',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditOutcome = { Succeeded: 'succeeded', Failed: 'failed', Denied: 'denied' } as const;
export type AuditOutcome = (typeof AuditOutcome)[keyof typeof AuditOutcome];

/** How urgently an alert reaches the on-call person: Critical pages them, Warning waits for working hours. */
export const AlertSeverity = { Critical: 'critical', Warning: 'warning' } as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

/** The values of one of the objects above, in declaration order. */
export function valuesOf<T extends Record<string, string>>(
  vocabulary: T,
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(vocabulary) as [T[keyof T], ...T[keyof T][]];
}
