import { pgEnum } from 'drizzle-orm/pg-core';
import {
  ActType,
  ApplicationStatus,
  ArtistStatus,
  AuditOutcome,
  BookingStatus,
  ConsentKind,
  ConsentSource,
  GatheringKind,
  MusicalKey,
  OverrideState,
  Pronoun,
  Style,
  ThemePreference,
  UploadPurpose,
  UploadStatus,
  valuesOf,
  VideoStatus,
  VscStatus,
} from '../../enums';

// The Postgres enums behind src/server/enums (ADR-0027). Adding a value is an expand migration.
export const actType = pgEnum('act_type', valuesOf(ActType));
export const artistStatus = pgEnum('artist_status', valuesOf(ArtistStatus));
export const style = pgEnum('style', valuesOf(Style));
export const pronoun = pgEnum('pronoun', valuesOf(Pronoun));
export const musicalKey = pgEnum('musical_key', valuesOf(MusicalKey));
export const videoStatus = pgEnum('video_status', valuesOf(VideoStatus));
export const overrideState = pgEnum('override_state', valuesOf(OverrideState));
export const bookingStatus = pgEnum('booking_status', valuesOf(BookingStatus));
export const gatheringKind = pgEnum('gathering_kind', valuesOf(GatheringKind));
export const themePreference = pgEnum('theme_preference', valuesOf(ThemePreference));
export const consentKind = pgEnum('consent_kind', valuesOf(ConsentKind));
export const consentSource = pgEnum('consent_source', valuesOf(ConsentSource));
export const vscStatus = pgEnum('vsc_status', valuesOf(VscStatus));
export const uploadPurpose = pgEnum('upload_purpose', valuesOf(UploadPurpose));
export const uploadStatus = pgEnum('upload_status', valuesOf(UploadStatus));
export const applicationStatus = pgEnum('application_status', valuesOf(ApplicationStatus));
export const auditOutcome = pgEnum('audit_outcome', valuesOf(AuditOutcome));
