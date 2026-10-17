import { z } from 'zod';
import { Role, ThemePreference, valuesOf } from '@/server/enums';
import { initials, type CurrentUser } from '@/server/services/accounts/current-user';

/**
 * The signed-in person as the app needs them: the header's initials and name, the roles that decide
 * which areas open, and the flags that route them (current-user names, ADR-0016). Only ever
 * returned to that person.
 */
export const CurrentUserResource = z.object({
  data: z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string(),
    /** Two letters for the avatar: "NF". */
    initials: z.string(),
    roles: z.array(z.enum(valuesOf(Role))),
    emailVerified: z.boolean(),
    /** A new address asked for and not yet confirmed from its link (L2-025.1), or null. */
    pendingEmail: z.string().nullable(),
    /** Two-step sign-in is on (L2-072.3). */
    mfaEnabled: z.boolean(),
    /** A booker's church, for the header's menu, the footer and Discover's starting point; null otherwise. */
    church: z
      .object({ name: z.string(), city: z.string(), latitude: z.number(), longitude: z.number() })
      .nullable(),
    /** The theme chosen on any signed-in device, or null to follow the device (L2-104.2). */
    themePreference: z.enum(valuesOf(ThemePreference)).nullable(),
    /** True when the current terms must be accepted before anything else (L2-080.3). */
    termsAcceptanceRequired: z.boolean(),
  }),
});

/** The password was right; a code from the authenticator app comes next (202). */
export const TwoFactorRequiredResource = z.object({
  data: z.object({
    twoFactorRequired: z.literal(true),
    /** The account being signed in to. */
    email: z.string(),
  }),
});

export type CurrentUserResource = z.infer<typeof CurrentUserResource>;

export function toCurrentUserResource(
  user: CurrentUser,
  termsAcceptanceRequired: boolean,
): CurrentUserResource {
  const { row } = user;
  return {
    data: {
      id: row.id,
      name: row.name,
      email: row.email,
      initials: initials(row.name),
      roles: user.roles,
      emailVerified: row.emailVerifiedAt !== null,
      pendingEmail: row.pendingEmail,
      mfaEnabled: row.mfaEnabled,
      church: user.church,
      themePreference: row.themePreference,
      termsAcceptanceRequired,
    },
  };
}
