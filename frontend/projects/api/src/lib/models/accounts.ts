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
