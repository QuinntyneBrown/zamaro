import { z } from 'zod';
import { GatheringKind, SearchSort, valuesOf } from '@/server/enums';
import {
  AvailabilityResource,
  SitemapResource,
  TourDatesResource,
} from '../resources/artist-profiles/dates';
import { ArtistProfileResource } from '../resources/artist-profiles/profile';
import { CurrentUserResource, TwoFactorRequiredResource } from '../resources/accounts/current-user';
import {
  ResendVerificationEmailRequest,
  VerifyEmailRequest,
} from '../requests/accounts/email-verification';
import {
  ChangeEmailRequest,
  ChangePasswordRequest,
  ConfirmEmailChangeRequest,
} from '../requests/accounts/account-security';
import {
  CheckPasswordResetRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../requests/accounts/password-reset';
import { RegisterBookerRequest } from '../requests/accounts/register-booker';
import {
  TwoFactorChallengeRequest,
  TwoFactorCodeRequest,
  TwoFactorProofRequest,
} from '../requests/accounts/two-factor';
import {
  SaveChurchRequest,
  UpdateContactPhoneRequest,
  UpdateProfileRequest,
} from '../requests/accounts/settings';
import { ChurchEnvelope, ChurchResource } from '../resources/accounts/church';
import { SessionListResource } from '../resources/accounts/session';
import { CurrentLegalDocumentsResource } from '../resources/privacy/legal-document';
import { AlternativesResource } from '../resources/discovery/alternatives';
import { LineupResource } from '../resources/discovery/lineup';
import { PlaceResource } from '../resources/discovery/place';
import { FeaturesResource } from '../resources/operations/features';
import { ReviewPageResource } from '../resources/reviews/review';
import { CatalogueResource } from '../resources/user-experience/catalogue';
import { AcceptTermsRequest, MarketingChoiceRequest } from '../requests/privacy/consents';
import { UpdatePreferencesRequest } from '../requests/user-experience/preferences';
import {
  SavedArtistIdsResource,
  SavedArtistListResource,
  SavedArtistStateResource,
} from '../resources/accounts/saved-artist';
import { ListAuditEntriesRequest } from '../requests/administration/audit-entries';
import {
  AuditEntryEnvelope,
  AuditEntryPageResource,
} from '../resources/administration/audit-entry';
import { UploadVulnerableSectorCheckRequest } from '../requests/artist-onboarding/vulnerable-sector-check';
import {
  CheckEnvelope,
  CurrentChecksResource,
} from '../resources/artist-onboarding/vulnerable-sector-check';
import { ListAdminArtistsRequest } from '@/app/api/v1/admin/artists/route';
import {
  AdminArtistDetailEnvelope,
  AdminArtistListResource,
} from '../resources/administration/artist';
import {
  AdminCheckEnvelope,
  AdminCheckQueueResource,
} from '../resources/administration/vulnerable-sector-check';
import { StartApplicationVideoUploadRequest } from '../requests/artist-onboarding/application-video';
import { ApplicationVideoEnvelope } from '../resources/artist-onboarding/application-video';
import { SubmitArtistApplicationRequest } from '../requests/artist-onboarding/application';
import { ArtistApplicationResource } from '../resources/artist-onboarding/application';
import type { Operation } from './document';

/** Every documented operation, one entry per route handler; each slice adds its own here. */
export const operations: Operation[] = [
  {
    method: 'get',
    path: '/i18n/{locale}',
    name: 'i18n.show',
    summary: 'The translation catalogue for one locale, with English filling any missing key',
    parameters: [{ name: 'locale', in: 'path', schema: z.string() }],
    responses: {
      200: {
        description: 'The catalogue; revalidate with If-None-Match',
        content: CatalogueResource,
      },
      304: { description: 'The catalogue has not changed', content: null },
      404: { description: 'No catalogue for the locale', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/search',
    name: 'search',
    summary: 'Artists free on the date who will drive to the event location',
    parameters: [
      {
        name: 'date',
        in: 'query',
        schema: z.string(),
        required: true,
        description: 'YYYY-MM-DD, 3 days to 18 months ahead',
      },
      { name: 'kind', in: 'query', schema: z.enum(valuesOf(GatheringKind)), required: true },
      { name: 'lat', in: 'query', schema: z.number(), required: true },
      { name: 'lng', in: 'query', schema: z.number(), required: true },
      {
        name: 'radius',
        in: 'query',
        schema: z.number().int(),
        required: true,
        description: '40, 80, 120 or 200',
      },
      { name: 'sort', in: 'query', schema: z.enum(valuesOf(SearchSort)) },
      {
        name: 'styles',
        in: 'query',
        schema: z.string(),
        description: 'Comma-separated style slugs',
      },
      { name: 'price', in: 'query', schema: z.literal('under-800') },
      { name: 'cursor', in: 'query', schema: z.string() },
    ],
    responses: {
      200: { description: 'One page of the lineup', content: LineupResource },
      422: { description: 'The search cannot run; errors are keyed by field', content: 'problem' },
      429: { description: 'More than 30 searches a minute', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/search/alternatives',
    name: 'search.alternatives',
    summary: 'Ways forward when a search finds nobody',
    parameters: [
      { name: 'date', in: 'query', schema: z.string(), required: true },
      { name: 'kind', in: 'query', schema: z.enum(valuesOf(GatheringKind)), required: true },
      { name: 'lat', in: 'query', schema: z.number(), required: true },
      { name: 'lng', in: 'query', schema: z.number(), required: true },
      { name: 'radius', in: 'query', schema: z.number().int(), required: true },
      { name: 'styles', in: 'query', schema: z.string() },
      { name: 'price', in: 'query', schema: z.literal('under-800') },
    ],
    responses: {
      200: {
        description: 'Nearby dates, a wider radius and whether filters apply',
        content: AlternativesResource,
      },
      422: { description: 'The search cannot run; errors are keyed by field', content: 'problem' },
      429: { description: 'More than 30 searches a minute', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/places',
    name: 'places',
    summary: 'The centre point of a typed town or a quick-pick city',
    parameters: [{ name: 'q', in: 'query', schema: z.string(), required: true }],
    responses: {
      200: { description: 'The place', content: PlaceResource },
      404: { description: 'No place matches that name', content: 'problem' },
      422: { description: 'The query is missing', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}',
    name: 'artists.show',
    summary:
      "An artist's public profile; 301 for a retired slug, 404 with similar artists when missing",
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      { name: 'date', in: 'query', schema: z.string(), description: 'The carried search date' },
      { name: 'kind', in: 'query', schema: z.enum(valuesOf(GatheringKind)) },
      { name: 'lat', in: 'query', schema: z.number() },
      { name: 'lng', in: 'query', schema: z.number() },
      { name: 'radius', in: 'query', schema: z.number().int() },
    ],
    responses: {
      200: {
        description: 'The profile; revalidate with If-None-Match',
        content: ArtistProfileResource,
      },
      301: { description: 'The artist has a new address (Location)', content: null },
      304: { description: 'The profile has not changed', content: null },
      404: {
        description: 'No viewable artist has the address; carries similarArtists',
        content: 'problem',
      },
      422: { description: 'The carried search is malformed', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}/reviews',
    name: 'artists.reviews',
    summary: "An artist's visible reviews, newest first, 10 at a time",
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      { name: 'cursor', in: 'query', schema: z.string() },
    ],
    responses: {
      200: { description: 'One page of reviews', content: ReviewPageResource },
      301: { description: 'The artist has a new address (Location)', content: null },
      404: { description: 'No viewable artist has the address', content: 'problem' },
      422: { description: 'The cursor does not decode', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}/tour-dates',
    name: 'artists.tour-dates',
    summary: "The artist's next 6 free or booked dates",
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      {
        name: 'from',
        in: 'query',
        schema: z.string(),
        description: 'YYYY-MM-DD; 3 days from today without one',
      },
    ],
    responses: {
      200: { description: 'The dates; revalidate with If-None-Match', content: TourDatesResource },
      301: { description: 'The artist has a new address (Location)', content: null },
      304: { description: 'The dates have not changed', content: null },
      404: { description: 'No viewable artist has the address', content: 'problem' },
      422: { description: 'The from date is not a date', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}/availability',
    name: 'artists.availability',
    summary: 'Whether the artist is free on one date',
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      { name: 'date', in: 'query', schema: z.string(), required: true },
    ],
    responses: {
      200: {
        description: 'The answer; revalidate with If-None-Match',
        content: AvailabilityResource,
      },
      301: { description: 'The artist has a new address (Location)', content: null },
      304: { description: 'The answer has not changed', content: null },
      404: { description: 'No viewable artist has the address', content: 'problem' },
      422: { description: 'The date is outside the booking window', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/sitemap',
    name: 'sitemap',
    summary: 'Every published profile and when it last changed',
    responses: {
      200: { description: 'The profiles', content: SitemapResource },
      304: { description: 'The list has not changed', content: null },
    },
  },
  {
    method: 'get',
    path: '/csrf-cookie',
    name: 'csrf-cookie',
    summary: 'Starts a guest session and writes the XSRF-TOKEN cookie',
    responses: { 204: { description: 'The cookies are set', content: null } },
  },
  {
    method: 'post',
    path: '/session',
    name: 'session.store',
    summary: 'Sign in: starts a session for Zamaro Web',
    requestBody: z.object({ email: z.string(), password: z.string() }),
    responses: {
      200: { description: 'The signed-in person', content: CurrentUserResource },
      202: {
        description: 'The password was right; a code comes next',
        content: TwoFactorRequiredResource,
      },
      419: { description: 'The CSRF token is missing or wrong', content: 'problem' },
      422: {
        description: 'Wrong credentials (errors.credentials) or missing fields',
        content: 'problem',
      },
      429: { description: 'Sign-in is paused for the address', content: 'problem' },
    },
  },
  {
    method: 'delete',
    path: '/session',
    name: 'session.destroy',
    summary: 'Sign out: ends the session on the server',
    responses: {
      204: { description: 'Signed out; a new session and CSRF token are set', content: null },
      401: { description: 'No one is signed in', content: 'problem' },
      419: { description: 'The CSRF token is missing or wrong', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/me',
    name: 'me.show',
    summary: 'The signed-in person',
    responses: {
      200: { description: 'The person', content: CurrentUserResource },
      401: { description: 'A guest', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/features',
    name: 'features',
    summary: 'Which unfinished features this environment has turned on',
    responses: {
      200: { description: 'The flags', content: FeaturesResource },
    },
  },
  {
    method: 'post',
    path: '/register',
    name: 'register',
    summary: 'Register as a booker; every valid submission gets the same 202',
    requestBody: RegisterBookerRequest,
    responses: {
      202: {
        description: 'A verification link was sent, or the existing owner was told',
        content: z.object({ data: z.object({ email: z.string() }) }),
      },
      409: {
        description: 'The terms or privacy policy shown are no longer current',
        content: 'problem',
      },
      422: {
        description: 'A field needs attention, or the bot challenge failed',
        content: 'problem',
      },
      429: {
        description: 'More than 10 registrations an hour from one address',
        content: 'problem',
      },
    },
  },
  {
    method: 'get',
    path: '/legal-documents/current',
    name: 'legal-documents.current',
    summary: 'The current terms of use and privacy policy',
    responses: {
      200: { description: 'The two documents', content: CurrentLegalDocumentsResource },
    },
  },
  {
    method: 'post',
    path: '/email/verify',
    name: 'email.verify',
    summary: 'Verify an email address from its emailed link; the person is not signed in',
    requestBody: VerifyEmailRequest,
    responses: {
      200: {
        description: 'The address is verified; the owner, for the thanks',
        content: z.object({ data: z.object({ name: z.string() }) }),
      },
      410: {
        description: 'The link was used, is over 24 hours old or is unknown',
        content: 'problem',
      },
      422: { description: 'No token', content: 'problem' },
    },
  },
  {
    method: 'post',
    path: '/email/verification-notification',
    name: 'email.resend-verification',
    summary: 'Send a new verification link; the answer is the same whether or not one was due',
    requestBody: ResendVerificationEmailRequest,
    responses: {
      202: {
        description: 'The request was taken',
        content: z.object({ data: z.object({ accepted: z.literal(true) }) }),
      },
      422: { description: 'A field needs attention', content: 'problem' },
      429: { description: 'More than 3 links in 15 minutes', content: 'problem' },
    },
  },
  {
    method: 'post',
    path: '/password/forgot',
    name: 'password.forgot',
    summary: 'Ask for a reset link; every valid request gets the same 202',
    requestBody: ForgotPasswordRequest,
    responses: {
      202: {
        description: 'The address typed, in lower case',
        content: z.object({ data: z.object({ email: z.string() }) }),
      },
      422: {
        description: 'A field needs attention, or the bot challenge failed',
        content: 'problem',
      },
      429: {
        description: 'More than 5 links an hour from one address or for one email',
        content: 'problem',
      },
    },
  },
  {
    method: 'post',
    path: '/password/reset/check',
    name: 'password.reset.check',
    summary: 'Check a reset link without using it',
    requestBody: CheckPasswordResetRequest,
    responses: {
      200: {
        description: 'The account the link resets and when the link stops working',
        content: z.object({ data: z.object({ email: z.string(), expiresAt: z.string() }) }),
      },
      410: {
        description:
          'Used, over 60 minutes old or unknown; one that existed names its account (email) and when it was sent (sentAt)',
        content: 'problem',
      },
      422: { description: 'No token', content: 'problem' },
      429: {
        description: 'More than 30 checks and resets a minute from one address',
        content: 'problem',
      },
    },
  },
  {
    method: 'post',
    path: '/password/reset',
    name: 'password.reset',
    summary:
      'Choose a new password with the link; every other session ends and this browser signs in',
    requestBody: ResetPasswordRequest,
    responses: {
      200: { description: 'Signed in', content: CurrentUserResource },
      202: {
        description: 'The password changed; the code step signs this browser in',
        content: TwoFactorRequiredResource,
      },
      410: {
        description: 'The link was used, is over 60 minutes old or is unknown',
        content: 'problem',
      },
      422: { description: 'A field needs attention', content: 'problem' },
      429: {
        description: 'More than 30 checks and resets a minute from one address',
        content: 'problem',
      },
    },
  },
  {
    method: 'put',
    path: '/account/profile',
    name: 'account.profile.update',
    summary: 'Change the account name; the initials follow it',
    requestBody: UpdateProfileRequest,
    responses: {
      200: { description: 'The signed-in person', content: CurrentUserResource },
      422: { description: 'The name is blank or over 120 characters', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/account/church',
    name: 'account.church.show',
    summary: "The signed-in booker's church; data is null until they save one",
    responses: {
      200: { description: 'The church, or null', content: ChurchEnvelope },
      404: { description: 'Not a booker', content: 'problem' },
    },
  },
  {
    method: 'put',
    path: '/account/church',
    name: 'account.church.update',
    summary: 'Save the church: the address must be found and within 200 km of Toronto by road',
    requestBody: SaveChurchRequest,
    responses: {
      200: { description: 'The church as saved', content: z.object({ data: ChurchResource }) },
      404: { description: 'Not a booker', content: 'problem' },
      422: {
        description:
          'A field needs attention; streetAddress when the address cannot be found, serviceArea when it is outside the service area',
        content: 'problem',
      },
    },
  },
  {
    method: 'get',
    path: '/account/contact-phone',
    name: 'account.contact-phone.show',
    summary: "The signed-in artist's private contact phone",
    responses: {
      200: {
        description: '"905-555-0148", or null until one is saved',
        content: z.object({ data: z.object({ contactPhone: z.string().nullable() }) }),
      },
      404: { description: 'Not an artist', content: 'problem' },
    },
  },
  {
    method: 'put',
    path: '/account/contact-phone',
    name: 'account.contact-phone.update',
    summary: 'Save the contact phone, stored encrypted in E.164',
    requestBody: UpdateContactPhoneRequest,
    responses: {
      200: {
        description: 'The number as shown',
        content: z.object({ data: z.object({ contactPhone: z.string() }) }),
      },
      404: { description: 'Not an artist', content: 'problem' },
      422: { description: 'Not a North American number', content: 'problem' },
    },
  },
  {
    method: 'put',
    path: '/account/email',
    name: 'account.email.update',
    summary: 'Ask for a new email, confirmed with the current password; the link decides',
    requestBody: ChangeEmailRequest,
    responses: {
      202: {
        description:
          'The new address, in lower case; the account email stays until the link is opened',
        content: z.object({ data: z.object({ email: z.string() }) }),
      },
      422: {
        description: 'A bad address, the current one, or a wrong password',
        content: 'problem',
      },
    },
  },
  {
    method: 'post',
    path: '/account/email/confirm',
    name: 'account.email.confirm',
    summary: 'Open an email change link: the account moves to the new address, verified',
    requestBody: ConfirmEmailChangeRequest,
    responses: {
      200: {
        description: 'The address the account now signs in with',
        content: z.object({ data: z.object({ email: z.string() }) }),
      },
      410: {
        description:
          'Used, over 24 hours old, unknown, or the address was taken meanwhile; one that existed names the address the account still signs in with (email)',
        content: 'problem',
      },
      422: { description: 'No token', content: 'problem' },
    },
  },
  {
    method: 'put',
    path: '/account/password',
    name: 'account.password.update',
    summary: 'Change the password: every other session ends and this one continues with a new ID',
    requestBody: ChangePasswordRequest,
    responses: {
      204: { description: 'Changed; the owner is emailed', content: null },
      422: {
        description:
          'A wrong current password, or a new one that fails the policy or its confirmation',
        content: 'problem',
      },
    },
  },
  {
    method: 'get',
    path: '/account/sessions',
    name: 'account.sessions.index',
    summary: 'The signed-in devices: this browser first, then the most recently active',
    responses: {
      200: { description: 'Every session within its idle lifetime', content: SessionListResource },
    },
  },
  {
    method: 'delete',
    path: '/account/sessions/{session}',
    name: 'account.sessions.destroy',
    summary: 'End a session: that device is signed out at once',
    parameters: [
      {
        name: 'session',
        in: 'path',
        schema: z.string(),
        description: 'The id from the list, not a session ID',
      },
    ],
    responses: {
      204: { description: 'Ended', content: null },
      404: {
        description: "Not one of the caller's sessions, or none by that id",
        content: 'problem',
      },
    },
  },
  {
    method: 'post',
    path: '/session/two-factor',
    name: 'session.two-factor',
    summary: 'Complete sign-in with a code from the app, or an unused recovery code once',
    requestBody: TwoFactorChallengeRequest,
    responses: {
      200: { description: 'Signed in with a new session', content: CurrentUserResource },
      401: {
        description: 'No password step is waiting, or it is over 10 minutes old',
        content: 'problem',
      },
      422: { description: 'The code or recovery code is wrong', content: 'problem' },
      429: {
        description: 'Sign-in is paused after 5 wrong passwords or codes in 15 minutes',
        content: 'problem',
      },
    },
  },
  {
    method: 'post',
    path: '/account/two-factor',
    name: 'account.two-factor.begin',
    summary: 'Begin two-step sign-in: a new key for an authenticator app, confirmed by a code',
    responses: {
      200: {
        description: 'The key in groups of four and what the QR code holds',
        content: z.object({ data: z.object({ key: z.string(), otpauthUri: z.string() }) }),
      },
      409: { description: 'Two-step sign-in is already on', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/account/two-factor/qr',
    name: 'account.two-factor.qr',
    summary: 'The QR code of the key begun, as SVG',
    responses: {
      200: { description: 'The image', content: 'svg' },
      404: { description: 'No key is waiting', content: 'problem' },
    },
  },
  {
    method: 'post',
    path: '/account/two-factor/confirm',
    name: 'account.two-factor.confirm',
    summary: 'Turn two-step sign-in on with the first code; the recovery codes are answered once',
    requestBody: TwoFactorCodeRequest,
    responses: {
      200: {
        description: 'On; 10 single-use recovery codes',
        content: z.object({ data: z.object({ recoveryCodes: z.array(z.string()) }) }),
      },
      409: { description: 'Two-step sign-in is already on', content: 'problem' },
      422: { description: 'The code does not match the key begun', content: 'problem' },
    },
  },
  {
    method: 'delete',
    path: '/account/two-factor',
    name: 'account.two-factor.destroy',
    summary: 'Turn two-step sign-in off with a current code or an unused recovery code',
    requestBody: TwoFactorProofRequest,
    responses: {
      204: { description: 'Off; the owner is emailed', content: null },
      404: { description: 'Two-step sign-in is not on', content: 'problem' },
      409: { description: 'An administrator keeps two-step sign-in on', content: 'problem' },
      422: { description: 'The code is wrong', content: 'problem' },
      429: {
        description: 'Sign-in is paused after 5 wrong codes or passwords in 15 minutes',
        content: 'problem',
      },
    },
  },
  {
    method: 'post',
    path: '/account/two-factor/recovery-codes',
    name: 'account.two-factor.recovery-codes',
    summary:
      'New recovery codes, replacing every earlier one, given a current code or an unused recovery code',
    requestBody: TwoFactorProofRequest,
    responses: {
      200: {
        description: 'The 10 new codes, answered once',
        content: z.object({ data: z.object({ recoveryCodes: z.array(z.string()) }) }),
      },
      404: { description: 'Two-step sign-in is not on', content: 'problem' },
      422: { description: 'The code is wrong', content: 'problem' },
      429: {
        description: 'Sign-in is paused after 5 wrong codes or passwords in 15 minutes',
        content: 'problem',
      },
    },
  },
  {
    method: 'post',
    path: '/account/consents/terms',
    name: 'account.consents.terms',
    summary: 'Accept the current terms; the answer is the person, no longer stopped',
    requestBody: AcceptTermsRequest,
    responses: {
      200: { description: 'Accepted and recorded', content: CurrentUserResource },
      409: {
        description: 'The version shown is no longer current (legal-document-outdated)',
        content: 'problem',
      },
      422: { description: 'No version', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/account/consents/marketing',
    name: 'account.consents.marketing.show',
    summary: 'The marketing choice: the latest marketing record',
    responses: {
      200: {
        description: 'The choice',
        content: z.object({ data: z.object({ granted: z.boolean() }) }),
      },
    },
  },
  {
    method: 'post',
    path: '/account/consents/marketing',
    name: 'account.consents.marketing.save',
    summary: 'Change the marketing choice; a settings record is appended and the earlier ones stay',
    requestBody: MarketingChoiceRequest,
    responses: {
      200: {
        description: 'The choice as saved',
        content: z.object({ data: z.object({ granted: z.boolean() }) }),
      },
      422: { description: 'Not a yes or a no', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/saved-artists',
    name: 'saved-artists.index',
    summary: 'The saved artists, newest first, each free or booked on the date when one is given',
    parameters: [
      {
        name: 'date',
        in: 'query',
        schema: z.string(),
        description: 'YYYY-MM-DD; without it no artist is marked',
      },
    ],
    responses: {
      200: { description: 'The visible saved artists', content: SavedArtistListResource },
      404: { description: 'Not a booker', content: 'problem' },
      422: { description: 'Not a calendar date', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/saved-artists/ids',
    name: 'saved-artists.ids',
    summary: 'The ids of the saved artists and their count',
    responses: {
      200: { description: 'The ids', content: SavedArtistIdsResource },
      404: { description: 'Not a booker', content: 'problem' },
    },
  },
  {
    method: 'put',
    path: '/saved-artists/{artist}',
    name: 'saved-artists.save',
    summary: 'Save an artist; saving twice is the same as once',
    parameters: [{ name: 'artist', in: 'path', schema: z.number().int() }],
    responses: {
      200: { description: 'Saved, with the count', content: SavedArtistStateResource },
      404: {
        description: 'Not a booker, or an artist not approved and published',
        content: 'problem',
      },
      422: { description: '200 are saved already (saved-artist-limit)', content: 'problem' },
    },
  },
  {
    method: 'delete',
    path: '/saved-artists/{artist}',
    name: 'saved-artists.unsave',
    summary: 'Remove a saved artist; removing one not saved changes nothing',
    parameters: [{ name: 'artist', in: 'path', schema: z.number().int() }],
    responses: {
      200: { description: 'Removed, with the count', content: SavedArtistStateResource },
      404: { description: 'Not a booker', content: 'problem' },
    },
  },
  {
    method: 'patch',
    path: '/me/preferences',
    name: 'me.preferences',
    summary: 'Save preferences: the theme every signed-in device follows',
    requestBody: UpdatePreferencesRequest,
    responses: {
      200: { description: 'The signed-in person', content: CurrentUserResource },
      422: { description: 'Not light, dark or null', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/admin/overview',
    name: 'admin.overview',
    summary: 'What is waiting for the Zamaro team; calling it counts as activity',
    responses: {
      200: {
        description: 'The counts beside the admin sections',
        content: z.object({ data: z.object({ checksWaiting: z.number().int() }) }),
      },
    },
  },
  {
    method: 'get',
    path: '/admin/audit-entries',
    name: 'admin.audit-entries.index',
    summary:
      'The audit log, newest first, 50 at a time, narrowed by actor, action, target, outcome and dates',
    parameters: Object.entries(ListAuditEntriesRequest.shape).map(([name, schema]) => ({
      name,
      in: 'query' as const,
      schema,
    })),
    responses: {
      200: { description: 'One page of the log', content: AuditEntryPageResource },
      422: { description: 'A filter is not valid', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/admin/audit-entries/{entry}',
    name: 'admin.audit-entries.show',
    summary: 'One audit entry; PATCH, PUT and DELETE answer 405',
    parameters: [{ name: 'entry', in: 'path', schema: z.number().int() }],
    responses: {
      200: { description: 'The entry', content: AuditEntryEnvelope },
    },
  },
  {
    method: 'post',
    path: '/artist/vulnerable-sector-checks',
    name: 'artist.vulnerable-sector-checks.store',
    summary:
      'Upload a Vulnerable Sector Check: the scan and its issue date, as multipart/form-data',
    requestBody: UploadVulnerableSectorCheckRequest,
    requestBodyType: 'multipart/form-data',
    responses: {
      202: {
        description: 'Taken; scanning until the malware scan passes, then pending',
        content: CheckEnvelope,
      },
      404: { description: 'Not an artist', content: 'problem' },
      413: { description: 'The body is over 32 MB', content: 'problem' },
      422: {
        description: 'Not a PDF, JPEG or PNG; over 10 MB; or no valid issue date',
        content: 'problem',
      },
    },
  },
  {
    method: 'get',
    path: '/artist/vulnerable-sector-checks/current',
    name: 'artist.vulnerable-sector-checks.current',
    summary:
      "Where the artist's checks stand: the latest verified one and the newest of any status",
    responses: {
      200: {
        description: 'The checks, each null when there is none',
        content: CurrentChecksResource,
      },
      404: { description: 'Not an artist', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/vulnerable-sector-checks/{check}/document-link',
    name: 'vulnerable-sector-checks.document-link',
    summary: "A five-minute signed link to the check's document, for its owner and administrators",
    parameters: [{ name: 'check', in: 'path', schema: z.number().int() }],
    responses: {
      200: {
        description: 'The link on the media host and when it stops working',
        content: z.object({ data: z.object({ url: z.string(), expiresAt: z.string() }) }),
      },
      404: {
        description: 'Not the owner or an administrator, an unknown check, or no document yet',
        content: 'problem',
      },
    },
  },
  {
    method: 'get',
    path: '/admin/vulnerable-sector-checks/{check}/document-link',
    name: 'admin.vulnerable-sector-checks.document-link',
    summary: "The admin application's copy of the document link, outside the terms gate",
    parameters: [{ name: 'check', in: 'path', schema: z.number().int() }],
    responses: {
      200: {
        description: 'The link on the media host and when it stops working',
        content: z.object({ data: z.object({ url: z.string(), expiresAt: z.string() }) }),
      },
    },
  },
  {
    method: 'get',
    path: '/admin/vulnerable-sector-checks',
    name: 'admin.vulnerable-sector-checks.index',
    summary: 'The checks waiting for verification, oldest upload first',
    responses: {
      200: { description: 'The queue and how many are waiting', content: AdminCheckQueueResource },
    },
  },
  {
    method: 'post',
    path: '/admin/vulnerable-sector-checks/{check}/verification',
    name: 'admin.vulnerable-sector-checks.verify',
    summary:
      'Verify a check: it counts for three years from its issue date, and the decision is audited',
    parameters: [{ name: 'check', in: 'path', schema: z.number().int() }],
    responses: {
      200: { description: 'The check, verified', content: AdminCheckEnvelope },
      409: {
        description: 'The check was already decided (vsc-already-decided)',
        content: 'problem',
      },
      422: { description: 'Issued more than 3 years ago', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/admin/artists',
    name: 'admin.artists.index',
    summary: 'Every approved and suspended artist, A to Z, with the counts',
    parameters: Object.entries(ListAdminArtistsRequest.shape).map(([name, schema]) => ({
      name,
      in: 'query' as const,
      schema,
      description: 'A word start in the name, base city or account email',
    })),
    responses: {
      200: { description: 'The list and the counts', content: AdminArtistListResource },
      422: { description: 'The search is too long', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/admin/artists/{artist}',
    name: 'admin.artists.show',
    summary: 'One artist: the account, the profile, the upcoming bookings and the standing',
    parameters: [{ name: 'artist', in: 'path', schema: z.number().int() }],
    responses: {
      200: { description: 'The artist', content: AdminArtistDetailEnvelope },
    },
  },
  {
    method: 'post',
    path: '/artist-applications/videos',
    name: 'artist-applications.videos.store',
    summary: 'Start a video upload for an application; the token names every later call',
    requestBody: StartApplicationVideoUploadRequest,
    responses: {
      201: {
        description: 'Started; Location is where the chunks go',
        content: ApplicationVideoEnvelope,
      },
      422: {
        description: 'A short title, a missing file name or a file over 1 GB',
        content: 'problem',
      },
    },
  },
  {
    method: 'get',
    path: '/artist-applications/videos/{token}',
    name: 'artist-applications.videos.show',
    summary: "The upload's state; Upload-Offset and Upload-Length say where it is (also on HEAD)",
    parameters: [{ name: 'token', in: 'path', schema: z.string() }],
    responses: {
      200: {
        description: 'Uploading, processing, live or failed',
        content: ApplicationVideoEnvelope,
      },
      404: { description: 'No upload has the token', content: 'problem' },
    },
  },
  {
    method: 'patch',
    path: '/artist-applications/videos/{token}',
    name: 'artist-applications.videos.append',
    summary: 'Append a chunk from Upload-Offset, which must be where the upload ends',
    parameters: [
      { name: 'token', in: 'path', schema: z.string() },
      { name: 'Upload-Offset', in: 'header', schema: z.number().int(), required: true },
    ],
    requestBody: z.string().describe('binary'),
    requestBodyType: 'application/offset+octet-stream',
    responses: {
      204: { description: 'Appended; Upload-Offset is where the next chunk starts', content: null },
      404: { description: 'No upload has the token', content: 'problem' },
      409: {
        description:
          'The chunk does not start where the upload ends (upload-offset-mismatch); Upload-Offset says where',
        content: 'problem',
      },
      413: { description: 'A chunk over 8 MB', content: 'problem' },
      415: { description: 'Not application/offset+octet-stream', content: 'problem' },
      422: { description: 'The chunk runs past the declared size', content: 'problem' },
    },
  },
  {
    method: 'post',
    path: '/artist-applications',
    name: 'artist-applications.store',
    summary:
      'Send an application; a retry with the same Idempotency-Key answers the one it created',
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        schema: z.string(),
        required: true,
        description: 'A UUID minted once per application, repeated on a retry',
      },
    ],
    requestBody: SubmitArtistApplicationRequest.omit({ idempotencyKey: true }),
    responses: {
      200: {
        description: 'The application a retry already created',
        content: ArtistApplicationResource,
      },
      201: {
        description: 'Sent: the number and the reply-by date',
        content: ArtistApplicationResource,
      },
      409: {
        description: 'The email already has an application in review (application-in-review)',
        content: 'problem',
      },
      422: {
        description: 'A field needs attention, or the bot challenge failed',
        content: 'problem',
      },
      429: { description: 'More than 10 in an hour from one address', content: 'problem' },
    },
  },
];
