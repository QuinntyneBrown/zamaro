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
  /** The theme chosen on any signed-in device, or null to follow the device. */
  themePreference: 'light' | 'dark' | null;
  /** The current terms must be accepted before anything else. */
  termsAcceptanceRequired: boolean;
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
