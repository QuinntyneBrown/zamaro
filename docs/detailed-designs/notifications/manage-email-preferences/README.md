# Manage email preferences

## Overview

Zamaro sends two kinds of email. Some are essential to a booking or payment, such
as the deposit request or the balance-charged notice. Others are helpful but
optional, such as event reminders and prompts to leave a review. This feature lets
a signed-in user turn the optional kinds off. It also guarantees that every
sending path honours that choice, while the essential kinds stay on.

The slice belongs to the notifications subsystem. It owns the preference store and
the `NotificationPreferenceGate` that every notification consults through
`TransactionalNotification::shouldSend()` in `notifications/send-transactional-emails`.
Its first consumer is `EventReminderNotification` in
`notifications/send-event-reminders`. The review-prompt email, sent by the reviews
subsystem, is the second. Marketing-email consent under CASL is a separate,
registration-time consent (L2-080) and is not a preference here.

Terms used in this design:

- **notification category** — group of emails that a user turns on or off together
- **transactional category** — category of emails about the user's own bookings and payments, which cannot be turned off
- **optional category** — category a user may turn off: event reminders or review prompts
- **notification preference** — stored on-or-off choice of one user for one optional category
- **notification settings** — account page at `/account/notifications` where a user changes preferences

## Description

The slice runs from the notification settings page in Zamaro Web to the preference
endpoints in the Zamaro API. The Zamaro Worker reads the preferences at send time.

**Frontend (Zamaro Web, `features/account`)**

- **`NotificationSettingsPage`** — routed page for `/account/notifications`, linked
  from account settings and from the footer of each optional email. It shows one
  design-system switch per category: event reminders, review prompts, and booking
  and payment emails. The booking and payment switch is on and disabled, with a
  line explaining that these emails cannot be turned off (L2-065). Each change saves
  immediately. The switch shows a busy state until the request returns (L2-108). A
  success toast confirms the save (L2-109). An error toast stays until dismissed and
  the switch returns to its previous position. Toast wording `<TO SUPPLY>`.
- **`NotificationPreferencesApi`** — typed client for the two endpoints below,
  returning `NotificationPreferenceDto` (`category`, `enabled`, `locked`).

**Backend (Zamaro API)**

- **`NotificationPreferencesController`** — controller for the signed-in user:
  - `GET /api/v1/account/notification-preferences` returns every category with its
    effective state from `NotificationPreferenceGate::forUser()`.
  - `PUT /api/v1/account/notification-preferences` validates
    `UpdateNotificationPreferencesRequest`, calls `UpdateNotificationPreferences` and
    returns the new state.
- **`UpdateNotificationPreferencesRequest`** — FormRequest that accepts a list of
  category and enabled pairs. Any change to `Transactional` fails with 422 and a
  field error (L2-065, L2-095).
- **`UpdateNotificationPreferences`** — action that upserts one
  `NotificationPreference` row per changed optional category inside a transaction.
- **`NotificationPreferenceGate`** — domain service in `App\Services\Notifications`.
  `allows(user, category)` returns true for `Transactional`. For an optional
  category it returns the stored choice, and a missing row means enabled. Every
  optional notification calls it at send time, so a change applies to the next email
  even if that email was queued earlier (L2-065).
- **`NotificationCategory`** — enum with `Transactional`, `Reminders` and
  `ReviewPrompts`. `isOptional()` is false only for `Transactional`. Every
  notification class declares its category through
  `TransactionalNotification::category()`.
- **Suppressed sends** — a notification that the gate refuses is recorded as
  `Suppressed` in `email_messages` (`notifications/send-transactional-emails`).

Whether optional emails also carry a one-click unsubscribe link that works without
signing in is `<TO SUPPLY>`. Each optional email links to the settings page.

**Data**

- `notification_preferences` — `user_id`, `category`, `enabled`, `updated_at`,
  unique on (`user_id`, `category`). Rows are deleted with the account (L2-082) and
  included in the personal data export (L2-081).

## Requirements

The feature realises the following level-2 (L2) requirement. It refines the
level-1 (L1) requirement shown, and the text is quoted from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-065` | `L1-014` | **Email delivery and preferences.**<br>Acceptance criteria:<br>1. Given the sending domain, when its DNS is checked, then SPF, DKIM and DMARC (policy quarantine or reject) are configured.<br>2. Given a transient send failure, when the email job runs, then it retries with exponential backoff up to 5 times before being marked failed and alerted.<br>3. Given a user opens notification settings, when they turn off reminder or review-prompt emails, then those stop; transactional emails about bookings and payments cannot be turned off.<br>4. Given a hard bounce, when it is reported, then the address is marked undeliverable and the user sees a banner asking them to update it. |

## Diagrams

### System context

Bookers and artists set their email preferences in Zamaro. Zamaro then sends
through the email delivery service only the emails each user allows.

![C4 system context for managing email preferences](diagrams/c4-context.png)

### Containers

Zamaro Web reads and saves preferences through the Zamaro API. The Zamaro Worker
reads the same table before it sends an optional email.

![C4 container view for managing email preferences](diagrams/c4-container.png)

### Components

`NotificationPreferencesController` validates changes and stores them through
`UpdateNotificationPreferences`. `NotificationPreferenceGate` is the single point that
both the API and the Worker use to read the effective choice.

![C4 component view for managing email preferences](diagrams/c4-component.png)

### Class structure

Each `NotificationPreference` holds one user's choice for one `NotificationCategory`.
`TransactionalNotification` asks `NotificationPreferenceGate` before sending.

![Class diagram for managing email preferences](diagrams/class-structure.png)

### Behaviour — turn off reminder emails

The user turns off reminders and the change saves at once. An attempt to turn off
booking and payment emails is rejected with 422. When a reminder later falls due,
the gate refuses it and the send is recorded as suppressed.

![Sequence diagram for turning off reminder emails](diagrams/sequence-update-preferences.png)
