/** A role on Zamaro; a person can hold more than one. */
export type Role = 'booker' | 'artist' | 'admin';

/** `GET /api/v1/me` and the sign-in answer: the signed-in person (ADR-0016). */
export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  /** Two letters for the avatar: "NF". */
  initials: string;
  roles: Role[];
  emailVerified: boolean;
  /** A new address asked for and not yet confirmed from its link (L2-025.1), or null. */
  pendingEmail: string | null;
  /** A booker's church, for the menu, the footer and Discover's starting point; null otherwise. */
  church: ChurchSummary | null;
  /** The theme chosen on any signed-in device, or null to follow the device. */
  themePreference: 'light' | 'dark' | null;
  /** The current terms must be accepted before anything else. */
  termsAcceptanceRequired: boolean;
}

/** The church as `/me` gives it (L2-024.2, L2-004.1). */
export interface ChurchSummary {
  name: string;
  /** "Burlington". */
  city: string;
  latitude: number;
  longitude: number;
}

/** `PUT /api/v1/account/church`: what the church form sends (L2-024.1). */
export interface ChurchDetails {
  name: string;
  streetAddress: string;
  city: string;
  /** "L7R 1A3", with or without the space. */
  postalCode: string;
  /** A North American number in any common format. */
  phone: string;
  denomination?: string | null;
  typicalAttendance?: number | null;
}

/** `GET /api/v1/account/church`: the booker's church, for its owner only. */
export interface Church {
  name: string;
  streetAddress: string;
  city: string;
  /** "ON". */
  province: string;
  postalCode: string;
  /** "905-555-0123". */
  phone: string;
  denomination: string | null;
  typicalAttendance: number | null;
}

/** `GET /api/v1/account/sessions`: one signed-in session (L2-025.3). */
export interface AccountSession {
  /** Names the session for ending it; never the session ID. */
  id: string;
  /** "Chrome on Windows". */
  deviceLabel: string;
  /** "Burlington, ON", or null. */
  approximateCity: string | null;
  /** ISO time. */
  lastActiveAt: string;
  /** The browser asking. */
  isCurrent: boolean;
}

/** `PUT /api/v1/account/password` (L2-025.2). */
export interface PasswordChange {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

/** `POST /api/v1/register` (accounts/register-booker). */
export interface Registration {
  name: string;
  email: string;
  password: string;
  /** The terms of use and privacy policy box. */
  acceptedTerms: boolean;
  /** The separate "Email me about new artists near my church" box. */
  marketingOptIn: boolean;
  /** The versions the form showed; the API refuses them with 409 once they are no longer current. */
  termsVersion: string;
  privacyPolicyVersion: string;
  /** The bot challenge provider's single-use token. */
  challengeToken: string;
  /** Where the verification link returns to. */
  returnUrl?: string;
}

/** `POST /api/v1/email/verify`: whose address the link verified (L2-022.3). */
export interface VerifiedEmail {
  name: string;
}

/**
 * `POST /api/v1/email/verification-notification`: a new link for the signed-in booker, else for the
 * owner of an expired link's `token`, else for the `email` just signed up with. Earlier links stop
 * working, and the answer is the same whether or not anything was sent.
 */
export interface VerificationResend {
  token?: string;
  email?: string;
  /** Where the new link returns to. */
  returnUrl?: string;
}

/** `POST /api/v1/password/forgot`: the same answer whether or not the address has an account. */
export interface PasswordResetRequest {
  email: string;
  /** The bot challenge provider's single-use token. */
  challengeToken: string;
}

/** `POST /api/v1/password/reset/check`: a link that still works (L2-023.3). */
export interface PasswordResetLink {
  email: string;
  /** ISO time it stops working. */
  expiresAt: string;
}

/** `POST /api/v1/password/reset`. */
export interface PasswordReset {
  token: string;
  password: string;
  passwordConfirmation: string;
}

/** One version of a legal document (`GET /api/v1/legal-documents/current`). */
export interface LegalDocument {
  /** "2026-10" */
  version: string;
  /** ISO date it takes effect. */
  effectiveFrom: string;
  url: string;
  summaryOfChanges: string[];
}

export interface CurrentLegalDocuments {
  terms: LegalDocument;
  privacyPolicy: LegalDocument;
}
