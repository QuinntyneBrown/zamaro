# Milestone 2 plan: accounts and sessions

**Status:** In progress on `feat/m2-accounts-and-sessions`, cut from the finished M1 branch.

## Current status (2026-10-10)

| Slice | Scope | Status | Commits |
|---|---|---|---|
| S0 | Groundwork: Sanctum, Redis sessions, Horizon queues, Mailpit, e2e account fixtures | Done | `dd82204`, `c57df76` (ADR-0015) |
| S1 | Sign in | Done | `193c96c` red tests, `e2a97ff` (ADR-0016) |
| S2 | Signed-in header, account menu and sign-out | Done | `4210c1f` red tests, `23effd2` (ADR-0017) |
| S3 | CSRF and session limits | Done | `81b4823` red tests, `82f6684` (ADR-0018) |
| S4 | The request gate | Done | `c9d2d56` red tests, `1014b36` |
| S5 | Register a booker, with consent | Done | `690da3b` red tests, `c6902ed` (ADR-0019) |
| S6 | Email delivery rules and failed jobs | Done | `cd08f71` red tests, `dc02dc1` |
| S7 | Verify the email address | Done | `fdc2b5b` red tests, `257d4c3` |
| S8 | Lockout and password reset | Done | `9c18620` red tests, `e5d3f3d` |
| S9 | Account settings: profile, church and contact phone | Done | `68008cd` red tests, `a23b482` (ADR-0020) |
| S10 | Change email and password | Done | `06caf7a` red tests, `06f77d8` |
| S11 | Signed-in devices | Done | `119f81a` red tests, `2265bb0` |
| S12 | Two-step sign-in: turn on and sign in with a code | Done | `51c4e93` red tests, `137843b` (ADR-0021) |
| S13 | Two-step sign-in: turn off and new recovery codes | Done | `2305396` red tests, `5612167` |
| S14 | Accept updated terms, and the marketing choice | Done | `166d8dd` red tests, `74d36d5` |
| S15 | Save an artist | Done | `8df925f` red tests, `a515feb` |
| S16 | Guest save through sign-in or sign-up | Done | `1b6fc36` red tests, `74847fe` |
| S17 | Saved artists list | Done | `462965c` red tests, `e590e85` |
| S18 | | Not started | |

**Checks at the last commit (S17, 2026-10-11):** 340 backend Feature tests pass with the contract
assertions; `scramble:export --fail-on-unknown`, `i18n:check`, Pint and Larastan are clean; frontend
lint, format and `ng build zamaro` are clean; `npx playwright test` passes 374 tests on win32; the new
`saved-default` and `saved-empty` states pass visual and a11y on win32 and in the Linux image, and the
Discover and not-found states still match there. Perf against the S16 build flagged nothing (numbers in
the ticket CRD).

**S17 acceptance criteria (as tested):**
- Given Naomi, then `GET /saved-artists?date=2026-11-14` lists Abigail, Hosanna Collective and Luz Viva in
  that order, all `free`, 44, 32 and 63 km from Riverside, `total` 3; on 2026-11-15 Abigail is `booked`;
  without a date every `availability` is null. A suspended saved artist is left out and not counted, and
  comes back when approved again. A new booker has `[]`; one with no church gets `distance: null`. A
  malformed date is 422, an artist 404, a guest 401; another booker's list is never seen.
- Given Naomi who searched Burlington, Sat 14 Nov, then the header's Saved link opens `/saved` ("Saved
  artists", "3 saved · free or booked on Sat 14 Nov, your last search", the date field at 2026-11-14) with
  "Saved Wed 7 Oct", "Saved Sun 27 Sep" and "Saved Sat 12 Sep", "Brampton · 44 km from you", "From $650",
  "Free Sat 14 Nov" and "Request Abigail Mensah for Sat 14 Nov" to `/artists/abigail-mensah?date=2026-11-14`,
  pressed hearts, the privacy note, and the Saved link current.
- Given Check date for 2026-11-15, then Abigail reads "Booked Sun 15 Nov" with "See free dates for Abigail
  Mensah" and no Request, and Hosanna "Free Sun 15 Nov".
- Given no search in the browser, then "3 saved · pick a date to see who’s free", an empty date field and
  no badges.
- Given a booker who removes Luz Viva, then her card leaves, "1 saved", "Saved 1 artists"; Undo brings it
  back.
- Given no saved artists, then "Nothing saved yet", "No saved artists yet", the text and "Find who’s free"
  to `/`, and no date field. While loading, "Loading your saved artists…", three skeleton tickets and a
  busy body; a failure says "We couldn’t load your saved artists" with Try again. A guest is sent to
  `/sign-in?returnUrl=%2Fsaved`.

**Checks at the last commit (S16, 2026-10-11):** frontend lint, format and `ng build zamaro` are clean;
`npx playwright test` passes 354 tests on win32; the Discover and profile states pass visual and a11y on
win32 and in the Linux image with the guest hearts and Save. No component changed, so no perf run was
due; the backend did not change.

**S16 acceptance criteria (as tested):**
- Given a guest on the Burlington lineup, then Hosanna Collective's heart is named "Save Hosanna
  Collective to your saved artists"; pressing it opens `/sign-in?returnUrl={the lineup}`, and signing in
  returns to the lineup with Hosanna pressed, "Saved Hosanna Collective" showing and "Saved 1 artists".
- Given a guest who presses it, then creates an account, opens the verification link (which returns to
  the lineup with "Email verified") and signs in from the header, then Hosanna is saved on the lineup.
- Given a guest who presses Hosanna, goes back and presses Luz Viva, then after signing in only Luz Viva
  is saved.
- Given a guest on Abigail's profile, then Save leads through sign-in back to the profile reading "Saved".

**Checks at the last commit (S15, 2026-10-11):** the backend Feature suite passes with the contract
assertions; `scramble:export --fail-on-unknown`, `i18n:check`, Pint and Larastan are clean; frontend
lint, format and `ng build zamaro` are clean; `npx playwright test` passes 350 tests on win32 and the
signed-in booker states pass visual and a11y in the Linux image. The perf run against the S14 build
flagged no row: `Button` was flagged once on a loaded machine (127.0 → 170.7 ms) and passed the one
re-run (131.6 → 127.3 ms); `SaveToggle` (120 ms) and `LineupSaved` (18 iterations) are new.

**S15 acceptance criteria (as tested):**
- Given Naomi, then `GET /saved-artists/ids` lists Abigail, Hosanna Collective and Luz Viva, count 3,
  privately. Saving Elijah answers `saved`, count 4, not a first save; saving again keeps 4; removing
  answers 3 and removing again keeps 3.
- Given a fresh booker, then their first save says `firstSave`, and a later one does not. At 200 saved the
  201st is the 422 `saved-artist-limit` problem and nothing changes. A suspended or unknown artist is
  404; an artist gets 404; a guest 401. Cards and the profile carry `id` and `pronoun`.
- Given every new route, then another booker's saves are untouched and their ids unseen.
- Given Naomi's Burlington lineup, then Luz Viva's heart is pressed and named "Remove Luz Viva from your
  saved artists", Elijah's is not ("Save Elijah Park to your saved artists"), the headliner's names
  Abigail, and the header reads "Saved 3 artists".
- Given a fresh booker saving Elijah, then the heart fills, the header reads "Saved 1 artists", "Saved
  Elijah Park" says "Your saved count is now 1." with Undo, and "Saved artists are private" says "Only
  you see who you save. …" with "View saved" to `/saved`; Undo empties the heart and the count. Removing
  says "Removed Elijah Park" and "He’s off your saved list. Your count is now 0." with Undo.
- Given a failed save, then the heart empties again and "Couldn’t save Elijah Park. Try again." ("Failed",
  "Your connection dropped, so his heart is empty again.", no timer) stays; Try again saves and closes it.
  At the limit, "You can save up to 200 artists." ("Heads up", "Remove someone from your saved list to
  make room for Elijah Park.", "Open saved artists") and the heart stays empty.
- Given Abigail's profile, then "Save" (not pressed) turns to "Saved" (pressed). Given Abigail signed in
  as an artist, then the lineup has no hearts and the header no Saved link.
- Naomi's Discover states now show her hearts and the Saved link; every signed-in booker state shows the
  Saved link.

**S14 acceptance criteria (as tested):**
- Given Tomi (Terms 2026-03), then sign-in and `/me` say `termsAcceptanceRequired`; Naomi's do not. His
  other signed-in calls get the 409 `terms-acceptance-required` problem; sign-out still works.
- Given he accepts 2026-10, then 200 with the person no longer stopped, one more record (terms 2026-10,
  granted, source `terms-update`, with the address), and his church answers again. Accepting 2026-03 gets
  409 `legal-document-outdated` and writes nothing. Before Thu 8 Oct nobody is stopped, and a new privacy
  policy alone stops no one.
- Given Naomi, then her marketing choice reads false; ticking it appends a `settings` record (no version)
  and keeps the earlier ones, and unticking appends another; "maybe" gets 422.
- Given a booker on the March terms opening `/account`, then `/account/accept-terms?returnUrl=%2Faccount`
  shows "We’ve updated our terms", "Accept them to keep using Zamaro. Here’s what changed:", the three
  changes, "Full terms of use" to `https://zamaro.ca/legal/terms`, the fine print "Terms of use, version
  2026-10, from Thu 8 Oct 2026. …" and focus on "Accept and continue"; accepting returns to `/account`.
  `/account/security/mfa` sends them there too.
- Given a failure, then "We couldn’t save your answer" and "Zamaro didn’t answer. Nothing was recorded;
  try again in a minute."; while accepting, "Accepting…" is busy and "Sign out" disabled. "Sign out"
  signs out.
- Given a booker's Email preferences, then "Bookings and payments" is ticked and disabled and "New
  artists near my church" unticked; ticking it and saving shows "Saved just now" and it stays ticked
  after a reload.
- Route state `accept-terms` (Tomi) matches `accept-terms/default.html` in both themes at every width
  with no axe violations.

**S13 acceptance criteria (as tested):**
- Given two-step sign-in on, when a current code or an unused recovery code is sent to turn it off,
  then 204: the key and every recovery code are gone, `auth.two_factor_disabled` is audited, "Two-step
  sign-in is off for your Zamaro account" is emailed and sign-in needs the password only. A wrong code
  gets "That code is wrong or has expired. Enter the code your app shows now, or an unused recovery
  code." and changes nothing; the 6th wrong try in 15 minutes is paused (429) even with the right code.
- Given a code or an unused recovery code, when new codes are asked for, then 10 codes unlike the old
  ones, `auth.recovery_codes_replaced` audited and "New recovery codes for your Zamaro account" emailed;
  the old codes stop working and the new ones work. With two-step sign-in off, both routes are 404.
- Given "On" in account settings, when "Turn off" is pressed, then "Turn off two-step sign-in?",
  described by "Enter a code to show it’s you.", lists the three consequences with the address, shows
  "Keep it on" then "Turn off", and focuses the code. A wrong code shows "Check the code", "That code
  didn’t work" and the field's message; the right code closes the dialog, the section reads "Off" and
  the email arrives.
- Given the dialog open, when Escape is pressed, then it closes, focus is back on "Turn off" and nothing
  changed.
- Given "New recovery codes", then "Get new recovery codes?" with "Cancel" then "Get new codes"; a
  recovery code shows "Save your new recovery codes" with 10 codes none of which is old, the email
  arrives, and "I’ve saved them" closes it with focus back on "New recovery codes".
- Given a failure, then "We couldn’t turn off two-step sign-in", "Nothing changed; it’s still on. …",
  "Try again" and focus on "Keep it on"; while a request is out, "Turning off…" is busy, "Keep it on" is
  disabled and the code read-only.
- Route state `account-two-step-on` (Naomi, `/me` saying it is on) matches `account/two-step-on.html` in
  both themes at every width with no axe violations.

**S12 acceptance criteria (as tested):**
- Given a booker, when they begin, then 200 with a base32 key in groups of four and an
  `otpauth://totp/Zamaro:` address holding it; nothing is on, the key is stored as `v1:` ciphertext, and
  the QR code is an `image/svg+xml`, no-store. A second key replaces the first; a code before any key, or
  for the replaced key, gets 422.
- Given the first right code, then 10 distinct `xxxx-xxxx` recovery codes once, stored as hashes only;
  `/me` says `mfaEnabled`; `auth.two_factor_enabled` is audited and "Two-step sign-in is on for your
  Zamaro account" is emailed. A wrong code gets "That code didn’t match. Codes change every 30 seconds;
  enter the one showing now." and turns nothing on. Turning it on again gets 409; a guest 401.
- Given two-step sign-in on, when the right password is sent, then 202 `{ twoFactorRequired, email }`
  and the browser is not signed in. A current code then signs in with a new session ID and audits the
  sign-in; a wrong one gets "That code is wrong or has expired. Enter the code your app shows now." and
  the step stays open; a recovery code works once, in any case and without its dash ("That recovery code
  is wrong or was used. …" the second time). No password step, or one 11 minutes old: 401. Three wrong
  passwords and two wrong codes pause sign-in (429) even for the right code. A reset with two-step
  sign-in on answers 202 and the code completes it.
- Given account settings, then Two-step sign-in reads "Off" and "Turn it on and Zamaro asks for a 6-digit
  code …"; "Turn on two-step sign-in" opens the setup page with the key, the QR code named "QR code that
  adds Zamaro, {email}, to an authenticator app", focus in the code and "Cancel and keep it off" to
  `/account#two-step`. The code from the key shows "Save your recovery codes", 10 codes, Copy and
  Download, the fine print naming the address; the email arrives, and "I’ve saved them" shows "On".
- Given a wrong code, then "Check the code", "That code didn’t match. Enter the one showing now.", the
  field's message, `aria-invalid` and the value kept. A failure shows "We couldn’t turn on two-step
  sign-in" and "Nothing changed; …"; a held request shows "Checking…", busy, with the field read-only.
- Given a booker with two-step sign-in on signing in from Abigail's profile, then "Enter your code" at
  `/account/sign-in/verify`, focus in the code, "Signing in as {email}.", and the code returns them to
  the profile, signed in. A wrong code shows "That code didn’t work", "Enter the code your app shows
  now" and the field's message; "Use a recovery code instead" shows its lead and help, and a recovery
  code signs in.
- Route states `mfa-setup` (Naomi, QR code and key masked) and `mfa-challenge` match their mocks in both
  themes at every width with no axe violations.

**S11 acceptance criteria (as tested):**
- Given a booker signed in from Firefox on a Mac (10.0.0.7), then Safari on an iPhone an hour later, then
  Chrome on Windows (127.0.0.1), when the last asks for its sessions, then "Chrome on Windows", "Safari on
  iPhone", "Firefox on Mac", `isCurrent` only on the first, cities Burlington, Burlington, Hamilton, and
  the iPhone's `lastActiveAt` is 11:00; the answer holds no session cookie value and no IP address. An
  address the locator does not know has no city.
- Given "End session" on another device, then 204, that browser's `/me` gets 401 and the list has one
  row; another person's key or an unknown one gets the 404 problem and their session keeps working.
- Given a request 4 minutes after sign-in, then `last_active_at` is unchanged; after 6 minutes it moves to
  that time. A session idle past the lifetime is not listed.
- Given the user agents of Edge on Windows, Chrome on Android, Safari on iPad and on a Mac, headless Chrome
  on Linux and curl, then the labels name them, and curl is "Unknown device".
- Given a booker signed in from this browser and an iPhone, then the page lists "Chrome on …" first with
  "This device" and "Burlington, ON · This device · active now", then "Safari on iPhone" with "Burlington,
  ON · Last active just now", and the help line. "End session on Safari on iPhone" removes the row at once
  and the phone's `/me` gets 401.
- Given one other session, then the Password lead ends "…your other device."; the nav lists "Signed-in
  devices".
- Route states `account-default` and `account-artist` show only this device and mask its line and the
  Password lead, which other specs signed in as the same cast member change.

**S10 acceptance criteria (as tested):**
- Given a booker with their password, when they ask for a new email, then 202 with the address in lower
  case; the account email is unchanged and `pending_email` holds the new one; the new address gets
  "Confirm your new email for Zamaro" with a `/account/email/confirm?token=…` link stored as SHA-256 and
  valid 24 hours, and the old one "Your Zamaro email is changing" naming it. A new request uses up the
  earlier link.
- Given the link, when anyone opens it, then 200 with the new address; the account signs in with it,
  verified, `pending_email` cleared and `account.email_changed` audited. Used, 24 hours and a minute old,
  unknown, or its address taken meanwhile: 410, and a link that existed names the current address.
- Given an address another account uses, then the same 202 and body, the notice to the old address, no
  link and no pending address. A wrong current password gets "That password isn’t right. Check it and try
  again."; an incomplete or unchanged address gets 422; a guest 401.
- Given a new password with the current one, then 204: the old password stops working and the new one
  signs in, every other session gets 401, this one continues under a new ID (the old cookie gets 401),
  one session stays registered, the owner is emailed and `auth.password_changed` is audited. A wrong
  current password, a 9-character or mismatched new one get 422.
- Given `/account`, then the nav reads Profile, Church (or Contact), Email, Password; the Email section
  says "You sign in with {email}. …". Asking for a new address shows "Saved just now", empties the fields
  and says "We sent a link to {new}. You sign in with {current} until you open it." (after a reload too);
  both emails arrive; opening the link lands on `/account` with "Email changed" and "You now sign in with
  {new}.", and the Email section names the new address.
- Given the link held, then "Confirming your new email" (busy), "Switching your sign-in to {new}…" and
  "Until this finishes you still sign in with {current}."; a 500 shows "We couldn’t confirm your new
  email" and "Zamaro didn’t answer. Nothing changed and your link still works; try again in a minute.",
  Back to account settings, and Try again confirms; a used link shows "This link has expired", the stamp,
  "Nothing changed: you still sign in with {new}. Ask for the change again to get a new link." and
  "Change email again" (`/account#email`).
- Given Naomi's address as the new one, then the page looks the same and no confirm email reaches her.
  A wrong password is named at Current password ("The password isn’t right" in the summary); an
  incomplete address ("Enter a full new email address", "Enter an email address like name@church.ca.")
  sends nothing.
- Given a new password from one browser, then "Saved just now", the fields empty, the page still works
  after a reload and the other browser's `/me` gets 401. A 9-character one shows "This one has 9
  characters. Use at least 12." and a wrong current one "That password isn’t right. …".
- Route state `confirm-email-expired` (Naomi, `/account/email/confirm?token=e2e-unknown`) matches
  `confirm-email/expired.html` in both themes at every width, with no axe violations.

**S9 acceptance criteria (as tested):**
- Given Naomi signed in, when she reads `GET /account/church`, then she gets Riverside (2150 Lakeshore
  Road, Burlington, ON, L7R 1A3, 905-555-0123, Non-denominational, 350), privately; a booker without a
  church gets `{ data: null }`, an artist 404 and a guest 401.
- Given a Burlington address, when it is saved, then it is geocoded (43.325, -79.799) and stored once
  per booker (a second save replaces it, 200), with the postal code as "L7R 1A3" and the phone as `v1:`
  ciphertext that reads back "905-555-0199". An Ottawa address gets 422 on `serviceArea` ("Zamaro serves
  churches within 200 km of Toronto.") and an unknown one 422 on `streetAddress` ("We couldn’t find that
  address. Check the street and postal code."), and nothing changes. A short postal code, a one-letter
  name, a non-NANP phone or 0 attendance get their 422 before any lookup.
- Given `/me`, then it carries `church` (name, city, point) for a booker.
- Given a new name, then `PUT /account/profile` answers the person with new initials ("RO"); a blank
  name gets "Enter your name." Abigail reads and saves her contact phone (`905-555-0148`; stored
  `+14165550190` as `v1:`), a non-NANP or blank one gets 422, a booker gets 404, and the phone is never
  on her public profile.
- Given the field key changes to v2 with v1 kept as a previous key, then old values read and new ones are
  `v2:`; with v1 dropped, reading fails (500) rather than returning ciphertext.
- Given every new route, then another booker or artist gets none of the owner's church, name or phone.
- Given `/account` signed in as Naomi, then "Account settings", "Naomi Fraser · Riverside Community
  Church", the nav "Profile, Church" (Profile current), her name with "Artists see it on your requests.",
  and the Church section filled in under its lead. A guest goes to `/sign-in?returnUrl=%2Faccount`.
- Given a fresh booker saving Riverside, then "Saved just now", the "Saved" banner (dismissible), the
  values after a reload, Riverside in the footer and the menu, and Discover pre-filled with Burlington at
  120 km. An Ottawa address shows "Your church wasn’t saved" (focused) with the service-area link, the
  message at Street address, City and Postal code invalid, "Church address outside the area · not saved"
  and every value kept; after a reload nothing was stored. An unknown address shows its message and
  "Church address not found · not saved".
- Given "L7R 1A", then "Fix 1 thing before saving", "Enter a full postal code" (which focuses the field),
  "Enter a postal code like L7R 1A3, with six characters.", "1 field to fix · not saved", and nothing
  is sent; a bad phone names "Enter a North American phone number, like 905-555-0123."
- Given a new name, then "Saved just now" and the header's "RO" for "Ruth Okafor". Discard restores the
  saved values. While saving: "Saving…" (busy), Discard disabled, fields read-only, the form
  `aria-busy`. A 500: "We couldn’t save your changes", "Not saved · try again", values kept. A failed
  load: "We couldn’t load your settings", Back to Discover, and Try again loads them.
- Given Abigail, then "Abigail Mensah · Artist", the nav "Profile, Contact", no Church section, her phone
  with "Churches see it only once a booking is confirmed. It’s never on your public profile.", and a
  save shows "Saved just now".
- Route states `account-default` (Naomi) and `account-artist` (Abigail) match their mocks' sections in
  both themes at every width with no axe violations; Naomi's Discover states now show her church.

**S8 acceptance criteria (as tested):**
- Given 5 failed sign-ins for one address within 15 minutes, in any case, when a 6th arrives, even with
  the right password, then it gets the 429 `sign-in-paused` problem with `pausedUntil` and `Retry-After`,
  and the owner gets one "Sign-in to your Zamaro account is paused" email per pause, naming the time and
  offering a reset. An address with no account is paused the same way and nobody is emailed; other
  addresses are not paused; failures more than 15 minutes apart do not add up; sign-in resumes after 15
  minutes; a successful sign-in starts the count again.
- Given the pause on `/sign-in`, then the card shows "Sign-in is paused for 15 minutes", "There were too
  many tries for this email. Try again after 10:15 a.m., or reset your password now.", "Reset your
  password" (to `/forgot-password`) and "If this wasn’t you, the account owner has been emailed.", and
  keeps the email.
- Given `/forgot-password` with any address, then it ends on "Check your email" and "If that email has
  an account, we’ve sent a reset link."; an account gets "Reset your Zamaro password" with a link that
  works once, for 60 minutes, and a new link stops the earlier one. A bad address is named before
  anything is sent, a failed bot check says so and keeps the email, and the 6th link in an hour from one
  address or for one email gets 429.
- Given a reset link, then `reset/check` names the account and when the link runs out without using it;
  saving a new password signs this browser in with a new session, ends every other session, uses the
  link and emails "Your Zamaro password was changed". Passwords follow `PasswordPolicy` and must match
  ("The two passwords don’t match. Type the new one again."); the 31st reset or check in a minute from
  one address gets 429.
- Given a used, run-out or unknown link, then 410 `link-expired`; one that existed names its account and
  when it was sent, and the page shows "This link has expired" with "Send a new link".
- Given each session, then `user_sessions` holds it by the SHA-256 of its ID; signing out removes it.
- Route state `forgot-password` matches `forgot-password/default.html` in both themes at every width, with
  no axe violations.

**S9 acceptance criteria (as tested):**
- Given Naomi signed in, when she reads `GET /account/church`, then she gets Riverside (2150 Lakeshore
  Road, Burlington, ON, L7R 1A3, 905-555-0123, Non-denominational, 350), privately; a booker without a
  church gets `{ data: null }`, an artist 404 and a guest 401.
- Given a Burlington address, when it is saved, then it is geocoded (43.325, -79.799) and stored once
  per booker (a second save replaces it, 200), with the postal code as "L7R 1A3" and the phone as `v1:`
  ciphertext that reads back "905-555-0199". An Ottawa address gets 422 on `serviceArea` ("Zamaro serves
  churches within 200 km of Toronto.") and an unknown one 422 on `streetAddress` ("We couldn’t find that
  address. Check the street and postal code."), and nothing changes. A short postal code, a one-letter
  name, a non-NANP phone or 0 attendance get their 422 before any lookup.
- Given `/me`, then it carries `church` (name, city, point) for a booker.
- Given a new name, then `PUT /account/profile` answers the person with new initials ("RO"); a blank
  name gets "Enter your name." Abigail reads and saves her contact phone (`905-555-0148`; stored
  `+14165550190` as `v1:`), a non-NANP or blank one gets 422, a booker gets 404, and the phone is never
  on her public profile.
- Given the field key changes to v2 with v1 kept as a previous key, then old values read and new ones are
  `v2:`; with v1 dropped, reading fails (500) rather than returning ciphertext.
- Given every new route, then another booker or artist gets none of the owner's church, name or phone.
- Given `/account` signed in as Naomi, then "Account settings", "Naomi Fraser · Riverside Community
  Church", the nav "Profile, Church" (Profile current), her name with "Artists see it on your requests.",
  and the Church section filled in under its lead. A guest goes to `/sign-in?returnUrl=%2Faccount`.
- Given a fresh booker saving Riverside, then "Saved just now", the "Saved" banner (dismissible), the
  values after a reload, Riverside in the footer and the menu, and Discover pre-filled with Burlington at
  120 km. An Ottawa address shows "Your church wasn’t saved" (focused) with the service-area link, the
  message at Street address, City and Postal code invalid, "Church address outside the area · not saved"
  and every value kept; after a reload nothing was stored. An unknown address shows its message and
  "Church address not found · not saved".
- Given "L7R 1A", then "Fix 1 thing before saving", "Enter a full postal code" (which focuses the field),
  "Enter a postal code like L7R 1A3, with six characters.", "1 field to fix · not saved", and nothing
  is sent; a bad phone names "Enter a North American phone number, like 905-555-0123."
- Given a new name, then "Saved just now" and the header's "RO" for "Ruth Okafor". Discard restores the
  saved values. While saving: "Saving…" (busy), Discard disabled, fields read-only, the form
  `aria-busy`. A 500: "We couldn’t save your changes", "Not saved · try again", values kept. A failed
  load: "We couldn’t load your settings", Back to Discover, and Try again loads them.
- Given Abigail, then "Abigail Mensah · Artist", the nav "Profile, Contact", no Church section, her phone
  with "Churches see it only once a booking is confirmed. It’s never on your public profile.", and a
  save shows "Saved just now".
- Route states `account-default` (Naomi) and `account-artist` (Abigail) match their mocks' sections in
  both themes at every width with no axe violations; Naomi's Discover states now show her church.

**S8 acceptance criteria (as tested):**
- Given 5 failed sign-ins for one address within 15 minutes, in any case, when a 6th arrives, even with
  the right password, then it gets the 429 `sign-in-paused` problem with `pausedUntil` and `Retry-After`,
  and the owner gets one "Sign-in to your Zamaro account is paused" email per pause, naming the time and
  offering a reset. An address with no account is paused the same way and nobody is emailed; other
  addresses are not paused; failures more than 15 minutes apart do not add up; sign-in resumes after 15
  minutes; a successful sign-in starts the count again.
- Given the pause on `/sign-in`, then the card shows "Sign-in is paused for 15 minutes", "There were too
  many tries for this email. Try again after 10:15 a.m., or reset your password now.", "Reset your
  password" (to `/forgot-password`) and "If this wasn’t you, the account owner has been emailed.", and
  keeps the email.
- Given `/forgot-password` with any address, then it ends on "Check your email" and "If that email has
  an account, we’ve sent a reset link."; an account gets "Reset your Zamaro password" with a link that
  works once, for 60 minutes, and a new link stops the earlier one. A bad address is named before
  anything is sent, a failed bot check says so and keeps the email, and the 6th link in an hour from one
  address or for one email gets 429.
- Given a reset link, then `reset/check` names the account and when the link runs out without using it;
  saving a new password signs this browser in with a new session, ends every other session, uses the
  link and emails "Your Zamaro password was changed". Passwords follow `PasswordPolicy` and must match
  ("The two passwords don’t match. Type the new one again."); the 31st reset or check in a minute from
  one address gets 429.
- Given a used, run-out or unknown link, then 410 `link-expired`; one that existed names its account and
  when it was sent, and the page shows "This link has expired" with "Send a new link".
- Given each session, then `user_sessions` holds it by the SHA-256 of its ID; signing out removes it.
- Route state `forgot-password` matches `forgot-password/default.html` in both themes at every width, with
  no axe violations.

**Checks at the last commit (S8, 2026-10-11):** 246 backend Feature tests pass with the contract
assertions; `scramble:export --fail-on-unknown`, `i18n:check`, Pint and Larastan are clean; frontend
lint, format and `ng build zamaro` are clean; `npx playwright test` passes 259 tests on win32 and the
sign-in and forgot-password states pass in the Linux image. No `zm-*` component changed, so no perf run.

**S7 acceptance criteria (as tested):**
- Given a link issued less than 24 hours ago, when it is opened, then the address is verified, the
  token used, the answer is 200 with the name (private, no-store) and no one is signed in; the same
  link again, one 24 hours and a minute old, or an unknown token gets the 410 `link-expired` problem
  ("This link has expired") and verifies nothing.
- Given Ruth signed in, unverified, when she asks for a new link, then 202 `{ accepted: true }`, one
  working 24-hour link is emailed (back to Discover) and the earlier one gets 410. A guest gets one by
  an expired or revoked link's token, or by the address just signed up with; an unknown address or
  token, or a verified one, gets the same 202 and nothing is sent. The 4th in 15 minutes gets 429.
- Given a guest who registers and opens the link from Mailpit, then Discover shows "Email verified"
  with "Thanks, Ruth. You can send booking requests now." and "Dismiss verified notice", and the next
  page has no banner. While the check is pending the card reads "Checking your link", `aria-busy`,
  "Confirming your email…"; when the API fails, "We couldn’t check your link" with "Zamaro didn’t
  answer. Your link still works; try again in a minute.", and Try again verifies.
- Given a used link, then "This link has expired" with the Expired stamp, "Keep browsing artists" to
  `/` and the fine print; "Send a new link" turns to "Sent" (disabled) with "A new link is on its way
  to the email you signed up with. It works for 24 hours.", and that new link works.
- Given an unverified booker signed in, then Discover and the 404 page show the persistent "Verify your
  email" banner, "We sent a link to {email}. You need it to send requests.", "Resend email" and no
  close button; pressing it shows "A new link is on its way to {email}. It works for 24 hours." and a
  disabled "Sent", the email arrives, and a minute later "Resend email" is back. A verified booker sees
  no banner.
- Given "Check your email to finish signing up", then the fine print reads "Nothing after 5 minutes?
  Check spam or junk, then resend.", and "Resend the email" sends a second email and shows "Sent" with
  the status line.
- Route state `verify-email-expired` (`/verify-email?token=e2e-unknown`) matches
  `verify-email/expired.html` in both themes at every width, with no axe violations.

**S6 acceptance criteria (as tested):**
- Given the mail server refuses every send, when `VerifyEmailNotification` runs, then it is released
  on `notifications` after about 10, 30, 90, 270 and 810 s (each within ±10 %), is not tried before
  its delay, and after the 6th failed attempt leaves the queue for `failed_jobs` (a UUID, the
  `database` connection, the `notifications` queue, the transport exception).
- Given that 6th failure, then `ErrorReporter` gets the exception with the request ID that queued the
  job, the release, the job name, queue and attempts, and `OnCallAlerter` gets one Critical
  `job-failed` alert naming the job and the request. A send that succeeds on a retry is neither stored
  nor reported. The fakes record what they are sent after redaction.
- Given every Zamaro email, then it has HTML and plain-text parts and no card number.
- Given `php artisan i18n:check`, then the repository's emails pass; a literal "Welcome" in an email
  view, a literal subject in a notification class, or a key missing from the English catalogue fails
  with the file and line. Blade comments, echoes and mail components are not text.

**S5 acceptance criteria (as tested):**
- Given a guest with a full name, an email, a 12–128 character password, the terms box ticked, the
  versions the form showed and a passing bot check, when they register, then they get 202 with the
  address in lower case, a booker with an Argon2id hash and no verified address exists, they are not
  signed in, and `VerifyEmailNotification` is queued on `notifications`.
- Given that email, then it is from Zamaro <hello@zamaro.ca>, "Verify your email for Zamaro", with HTML
  and text parts, "Hi Ruth,", and a `{web}/verify-email?token=…&returnUrl=…` link whose token is
  stored only as its SHA-256 and expires in 24 hours.
- Given an address that has an account, in any case, then the answer is the same 202 and body, nothing
  changes, and its owner gets "Someone tried to sign up with your email" with a sign-in link.
- Given a 9- or 129-character password, a breached one ("This password appears in a known data breach.
  Choose another."), an unticked terms box, a blank name or a bad email, then 422 on that field and no
  account. The 11th registration in an hour from one address gets 429.
- Given registration, then three consent records are written (terms 2026-10, privacy-policy 2026-10,
  marketing-email false, or true when ticked), each with the time, source `registration`, the address
  and the browser; they cannot be updated or deleted. Versions no longer current get 409
  `legal-document-outdated` and nothing is written. `GET /legal-documents/current` is public, and
  before Thu 8 Oct it names the March terms.
- Given a `fail`, missing or unverifiable bot token, then 422 on `challengeToken` ("We couldn’t check
  that you’re a person. Try again; if it keeps happening, email hello@zamaro.ca.") before validation,
  with no account and no email.
- Given `/sign-up`, then focus is in Full name, the terms and news boxes are separate and unticked, and
  the password is described by "12 to 128 characters. Passwords found in known data breaches are
  refused." Registering shows "Check your email to finish signing up" (focused) with "We sent a link to
  {email}. It works for 24 hours.", and Mailpit holds the verification email; a known address shows
  the same and its owner is emailed.
- Given the request pending, then the button reads "Creating account…" with `aria-busy` and
  `aria-disabled`, the fields are read-only, the boxes disabled and still ticked, and a second press
  sends nothing.
- Given "grace2026" and an unticked terms box, then the focused summary reads "Fix 2 things to
  continue" with "Use at least 12 characters for your password" and "Accept the terms and privacy
  policy"; the fields show "This one has 9 characters. Use at least 12." and "Accept the terms and
  privacy policy to create an account.", are `aria-invalid` and described by them; every value stays
  and nothing is sent; the summary's link focuses the box.
- Given a failed bot check, then "We couldn’t check that you’re a person" and every value, both boxes
  included, stays; given a 500, then "We couldn’t create your account" and the password stays.
- Given `/sign-in`, then the header shows "Create account" and the card "Create an account", both to
  `/sign-up`, whose "Already have an account? Sign in" leads back; a guest's footer lists "Sign in" and
  "Create an account".

**S4 acceptance criteria (as tested):**
- Given a booker, when they call a `role:artist` or `role:admin` route, then they get the
  `not-found` 404 with the same title and detail as an unknown address, and none of the route's data;
  an artist gets through `role:artist`.
- Given every `auth:sanctum` route, then `route-ownership-fixtures.php` has its case, and another
  signed-in user gets none of the owner's data: `GET /me` answers the intruder with their own account,
  and the intruder signing out leaves the owner signed in. A route with no case fails the suite.
- Given a body of 1,048,577 bytes, or a declared `Content-Length` over 1 MB, then 413
  `payload-too-large`; exactly 1,048,576 bytes reaches validation (422).
- Given a `text/plain`, form or untyped body, then 415 `unsupported-media-type`; JSON with a charset
  is accepted, and a request with no body needs no `Content-Type`.
- Given one address, when it sends its 121st anonymous request in a minute, to any mix of routes, then
  it gets the 429 `too-many-requests` problem with `Retry-After`; another address has its own
  allowance and the next minute starts afresh. Given Naomi signed in, then her 300 requests a minute
  pass and the 301st gets 429 from any address.
- Given Naomi signed in, when she makes her 31st search in a minute from a new address each time, then
  it gets 429.
- Given a preflight from `http://localhost:4200`, then it may send credentials; another origin gets no
  `Access-Control-Allow-Origin`, on a preflight or a read.
- Given a log line whose context holds `password`, `current_password`, `password_confirmation`,
  `challengeToken`, `X-XSRF-TOKEN`, `Cookie`, `Authorization`, `remember_token`, `session_id` or a
  message `body`, at any depth, then each value is `[REDACTED]` and none reaches the log;
  `processor_payment_id` and card numbers keep their last 4 digits (`…4242`).

**S3 acceptance criteria (as tested):**
- Given Naomi signed in, when `DELETE /api/v1/session` arrives without `X-XSRF-TOKEN`, with a wrong
  one, or marked `Sec-Fetch-Site: same-origin` without one, then it gets the 419
  `csrf-token-mismatch` problem and she is still signed in; with the `XSRF-TOKEN` cookie's value it
  gets 204. Every state-changing `/api/v1` route refuses a request without the token.
- Given a session, when it is used again within 7 days it works, and after 7 days and a minute idle it
  gets 401. Given a session used every 6 days, then a minute before 30 days it works and at 30 days it
  gets 401, on `/me` and once on an anonymous route, after which requests are a guest's.
- Given a booker whose CSRF token is spoiled, when they sign out, then the first request gets 419, the
  app fetches the cookie, the repeat gets 204 and the header shows "Sign in".
- Given every sign-out refused with 419, then after the retry a danger toast reads "Failed", "That
  didn’t go through.", "Reload the page and try again." and Naomi is still signed in.
- Given Naomi on her search when the API starts answering 401, when she changes the sort, then she
  lands on `/sign-in?returnUrl=…&ended=1` with "Your session ended" and "Sign in again to carry on.
  Nothing you typed is lost.", her email filled in and focus in Password; signing in returns her to
  the sorted search. Opened directly, the page starts in an empty Email.

**S2 acceptance criteria (as tested):**
- Given Naomi signed in, when she sends `DELETE /api/v1/session`, then she gets 204 (private, no-store),
  is a guest, the session cookie she held gets 401 from `/me`, and the answer sets a new session ID and
  CSRF token. A guest gets the 401 `unauthenticated` problem.
- Given a guest on Discover, then the header shows "Sign in" and the footer's last column is "Your
  account" with "Sign in". Given a guest on Abigail's profile, when they follow the header's "Sign
  in" and sign in, then they are back on her profile.
- Given Naomi signed in, when Discover has loaded in the browser, then the header shows "NF" named
  "Account menu for Naomi Fraser", no "Sign in", and the footer's last column is headed "Naomi
  Fraser". The server HTML for her contains neither her name nor her email. At 320 px the initials
  stay beside the menu button and the page does not scroll sideways.
- Given the account menu open, then it is named "Account menu for Naomi Fraser", shows her name and
  email, lists Account settings and Sign out (no "Your bookings"), focuses Account settings, and the
  avatar is `aria-expanded`. Tab reaches Sign out; Escape closes it and focus returns to the avatar.
- Given a fresh booker who signs out from the menu, then the header shows "Sign in" and their old
  session cookie gets 401 from `/me`.

**S1 acceptance criteria (as tested):**
- Given Naomi's email and password from a web origin, when she signs in, then she gets 200 with her
  name, `initials` "NF", `roles` ["booker"] and `emailVerified` true, `Cache-Control: private,
  no-store`, a new `zamaro_session` (HttpOnly, Secure, SameSite=Lax) whose ID differs from the one
  sent, and an `auth.sign_in` audit entry. The address matches in any case.
- Given a wrong password, or an email with no account, then both get the same 422 with
  `errors.credentials` "Email or password is incorrect.", and the unknown email is checked against a
  dummy hash (one `Hash::check`).
- Given Naomi signed in, when the app asks `GET /api/v1/me`, then it gets her account with
  `themePreference` null and `termsAcceptanceRequired` false, privately; a guest gets the 401
  `unauthenticated` problem, with or without `Accept: application/json`.
- Given `/sign-in?returnUrl=/artists/abigail-mensah?date=2026-11-14`, when Naomi signs in, then she
  lands on Abigail's profile; a return address on another site sends her to Discover. Focus starts
  in Email.
- Given a wrong password (a fresh booker) or an unknown email, when the card answers, then it shows
  "Couldn’t sign you in" with the link "Email or password is incorrect.", focused, keeps the email,
  clears the password, and both fields are `aria-invalid` and described by the message.
- Given the request is pending, then the button reads "Signing in…" with `aria-busy` and
  `aria-disabled`, and both fields are read-only. Given a 500, then "We couldn’t sign you in" shows
  and the email and password are kept.
- Passwords are stored as Argon2id; `cast:booker` makes a verified booker and refuses production.

## Changes made while implementing

- **S0 — Mailpit host ports.** Mailpit listens on 1025 and 8025 inside Compose, but its host ports are
  `:1026` (SMTP) and `:8026` (inbox and API), because Mailpit's defaults are often held by another
  local stack (they were on this machine). The verify step reads `:8026/api/v1/info`; e2e reads
  `E2E_MAILPIT_URL` (default `http://localhost:8026`). Recorded in ADR-0015.
- **S0 — e2e session lifetime.** `api-e2e` sets `SESSION_LIFETIME=525600`. Cookie expiry dates are
  computed from the frozen clock, so a 7-day lifetime would make the browser drop the session and
  XSRF cookies once the real date passes Fri 16 Oct 2026. The 7- and 30-day limits stay in the
  backend tests (S3), with time travel. Recorded in ADR-0015.
- **S0 — Horizon.** One supervisor per queue (`high`, `notifications`, `default`), one process each
  locally and in every environment without its own entry (D18).
- **S1 — The auth card is `zm-booking-form variant="auth"`.** The booking-form CRD already specifies
  the "Admit one" card as that variant (AC-6, AC-13, AC-14), so no `zm-auth-card` component exists;
  `AuthCard` is its perf scenario, as CRD AC-30 names it.
- **S1 — Interim field inputs.** The CRDs split the field into `zm-form-field` and `zm-text-field`,
  which M1 deferred. Sign-in needed email and password inputs, the "(required)" marker, read-only
  while busy and a shared form-level message, so the monolithic field gained `type` email and
  password, `requiredMarker`, `readonly`, `invalid` and `describedBy` (recorded in the form-field
  CRD). `zm-alert` gained `compact`.
- **S1 — `zm-error-summary` has `role="group"`.** Its `aria-labelledby` needs a role to name; the CRD
  forbids `role="alert"`. Recorded in the form-layout CRD. Discover keeps its hand-written summary
  for now.
- **S1 — Entry points.** The card's "Forgot your password?" and "Create an account" links, the
  header's "Sign up" and the footer's "Your account" column join when their pages exist (S8, S5) and
  with the signed-in shell (S2), as M1 did for links to later screens. The `/sign-in` baselines show
  the card without them; the rest matches the mock.
- **S1 — The error state keeps the password.** The mock shows it empty, but L2-108.3 keeps every
  value entered; focus moves to the password. Recorded in the sign-in design.
- **S1 — Empty fields.** No mock or copy covers an empty submit, so the API's 422 on `email` or
  `password` shows the same one message as wrong credentials.
- **S1 — Return address.** `returnUrl` must be a path on the site; anything else lands on Discover.
- **S1 — Placeholder fields in `/me`.** `CurrentUserResource` returns `themePreference: null` until S18
  and `termsAcceptanceRequired: false` until S14, as the slice's behaviour lists them.
- **S1 — Audit timestamps** come from the database clock (the design's rule), so e2e entries carry the
  real time, not the frozen one.
- **S1 — Cast addresses.** Tomi signs in as `tomi.oduya@harvestpointchurch.ca` (no mock names one).
  The seeder moves Naomi, Abigail and Tomi off their `@cast.zamaro.test` addresses on a database
  seeded before M2.
- **S1 — One visual flake seen.** In one full run `discover-results` (XS, dark) was captured while the
  lineup was still growing (3,987 px, then 7,141 px tall); it passed alone three times and in the next
  full run. Watch it; if it recurs, the route state should wait for the lineup rather than for
  network idle.

- **S2 — "Sign in", not "Sign up", after signing out.** L2-023.5 and the mocks show "Sign in" in the
  signed-out header; the plan's "Sign up" is the sign-in page's own header link ("Create account",
  "Sign up" below 480 px), which joins with `/sign-up` in S5. Until then `/sign-in` has no auth link.
- **S2 — The header's "Sign in" carries `returnUrl`.** `TopBarAuth` gained `queryParams` (top-bar
  CRD D-14) so L2-023.1's way back works from every page. The footer's "Sign in" is a plain link.
- **S2 — Parts that wait for their screens.** The footer's signed-in column has only Naomi's name
  until her church (S9) and "Saved artists (3)" (S15); the menu's who line has no church line until
  S9 (menu CRD D-9, `detail` optional). "Account settings" already links to `/account` (S9), as the
  slice's behaviour lists it.
- **S2 — No private routes yet.** `RenderMode.Client` lands with the first private route (S9, S17);
  ADR-0017 records the rule. Sign-out is not audited: the sign-in design lists no entry for it.
- **S2 — No CSRF cookie at start-up.** `AuthService.load()` asks `/me` after the first render in the
  browser; sign-in fetches `/sanctum/csrf-cookie` first and every signed-in answer carries a fresh
  `XSRF-TOKEN`, so the start-up call the sessions design lists is not needed. S3's recovery covers a
  stale token.
- **S2 — Avatar.** Only `zm-avatar-button` and `avatarInitials` are built; its scenario is
  `AvatarButton.ts` (the avatar CRD's name). `zm-avatar` and its `Avatar.ts` come with their first
  caller. The top bar's `account="loading"` waits for the first private route.
- **S2 — The menu dialog is styles only.** Built with `@if` and `ngTemplateOutlet`, `zm-dialog`'s menu
  variant made the `Dialog` scenario 45 % slower (flagged); the variant now hides the header parts with
  CSS and renders the same nodes (dialog CRD D-17). `zm-menu` renamed `toggled` to `activated`.
- **S2 — Visual baselines.** Every baseline was rewritten (`--update-snapshots=all`) on win32 and linux:
  the header's "Sign in" and the footer column change every page by less than the 0.1 % tolerance at
  some widths, so a plain update would have kept stale images. Discover states now wait for the
  lineup's cards (`shows: 'lineup'`) or the sold-out panel before capture: the S1 flake was a capture
  taken before a late client-side search answered.
- **S3 — The token on every request (ADR-0018).** Laravel 13 lets `Sec-Fetch-Site: same-origin`
  requests through without a CSRF token, so Chromium never got a 419. Zamaro's `ValidateCsrfToken`
  drops that bypass, as L2-073.2 and the design require.
- **S3 — `ToastService` already exists** in the components library (M1 S16), with `zm-toast` and
  `zm-toast-region` and their `Toast` and `ToastStack` scenarios, so no `app/shared/ToastService` or new
  component was built. The api library reports a second 419 through the `CSRF_REFUSED` token, which the
  zamaro app binds to the toast (`app/shared/session-notices.ts`).
- **S3 — The retry sets its own header.** Angular's XSRF interceptor runs before the app's
  interceptors, so `csrfRecoveryInterceptor` repeats the request with the new cookie's token itself.
- **S3 — Ended sessions in e2e.** The frozen clock cannot age a session, and with the cookie cleared
  only an authenticated call answers 401, which S3 has none of besides sign-out. The spec answers 401
  for every API call (`Session.endOnServer()`); `SessionLifetimeTest` proves when the API does so.
- **S3 — Sign-out's 401 is not "session ended".** A sign-out whose session had already ended clears
  the person and shows "Sign in", without the sign-in page.
- **S3 — The email is carried to the sign-in page** as navigation state, as the expired mock shows it
  filled in; opened directly, `/sign-in?ended=1` starts empty (route state `sign-in-ended`, the line
  masked for M5's draft copy).
- **S3 — A session with no `auth.started_at`** predates the rule and is ended, not trusted.
- **S3 — Tests send cookies.** JSON test requests sent no cookies (Laravel sends them only with
  `withCredentials()`), so S1's session-ID test passed without sending its cookie, and in-memory guard
  and session state hid ended sessions. `UsesTheWebApp` now sends credentials, and `asANewRequest()`
  forgets the guard and session data between requests; time-travel tests use UTC so 30 days are
  30 × 24 hours across the 1 Nov clock change.
- **S4 — No role-guarded route exists yet.** The role tests register a throwaway `role:artist` and
  `role:admin` route; the first real ones (`ArtistContactController`, S9) join the cross-user suite.
  The two identifier-less routes (`/me`, `DELETE /session`) assert that the intruder sees nothing of
  the owner's and leaves the owner signed in (authorise-and-validate design).
- **S4 — The gate runs first.** `LimitRequestBodySize` and `EnsureJsonRequest` are prepended to the
  `api` group, before the session, CSRF check and limiter, so an oversized or non-JSON body is refused
  without touching Redis. The `uploads` exemption waits for M4's first upload route.
- **S4 — `throttleApi()`, not `throttleWithRedis()`.** The counters already live in Redis through the
  cache store; the limit-request-rates design now says so. The api limits are
  `ZAMARO_API_LIMIT_PER_MINUTE` and `ZAMARO_API_SIGNED_IN_LIMIT_PER_MINUTE`, raised on `api-e2e`.
- **S4 — Server renders share one address (open, M9).** Zamaro Web's SSR calls the API from its own
  container, so in production every server render would count toward one anonymous allowance. M9's
  trusted proxies must include the web container and the SSR backend must forward the client
  address; recorded in the limit-request-rates design.
- **S4 — 413 and 415 are problem types** (`payload-too-large`, `unsupported-media-type`, D10), and PHP's
  own `PostTooLargeException` renders as the same 413. `RequestGateResponses` documents 429 on every
  operation and 413 and 415 on POST, PUT and PATCH.
- **S4 — Redaction spares UUIDs.** A card number must stand alone and pass the Luhn check, so request
  IDs and other long numbers stay readable.
- **S4 — Larastan at level 0.** The raw-SQL rule lives in `backend/tools/phpstan/` (AGENTS.md tree)
  and runs in `.ci/backend-test.sh`; it found `Artist::styles()` interpolating the style order, which
  is now a bound array. Raising the level is left for M9.
- **S5 — e2e runs the queue in `worker-e2e` (ADR-0019).** The open item from S0/S1: `api-e2e` queued
  mail on its own Redis prefix, which no worker read. `worker-e2e` runs `queue:work` on the high,
  notifications and default queues with `api-e2e`'s environment, shared through one
  `x-e2e-environment` anchor (database, prefixes, frozen clock, raised limits, `ZAMARO_WEB_URL`); M4 D6
  and M7 reuse it. Restart it with `api-e2e` after a PHP change. `mailbox.ts` needed no change.
- **S5 — The 202 carries the address.** An empty 202 would still get a `text/html` content type, so the
  answer is `{ data: { email } }`, identical for a new and a known address.
- **S5 — "Check your email" is a state of `/sign-up`**, a region named by its heading, not a route, so the
  address never sits in a URL. Its "Resend the email" button and the "Nothing after 5 minutes?" line
  join with resend (S7). "Wrong address? Start again" returns to the form with every value kept, in
  Email. The form's "Apply as an artist" fine print joins with `/artists/apply` (M3).
- **S5 — Copy without a mock.** The mocks cover a short password and the terms box only. A blank name
  ("Enter your full name."), a bad email ("Enter an email address like name@church.ca."), a long
  password ("This one has {count} characters. Use at most 128.") and a breached one ("This password
  appears in a known data breach. Choose another.") follow their pattern, each with a summary line.
  The page checks what it can before sending and maps the API's 422 fields onto the same copy; a 409
  fetches the new versions and shows "We couldn’t create your account".
- **S5 — Server validation messages are English literals**, as S1's `errors.credentials` is; the page
  shows its own catalogue copy by field. Emails, which no page translates, use the `emails` catalogue.
- **S5 — A March privacy policy is seeded** beside Terms 2026-03, so a version of each document is current
  on every day (the registry 404s otherwise). Tomi's records are Terms and Privacy 2026-03; Naomi's are
  the October versions with marketing off.
- **S5 — No cache for current versions.** `LegalDocumentRegistry` reads two indexed rows on demand, so a new
  version applies on its first day; the record-consent design said Redis.
- **S5 — Timestamptz columns written by the app** (`consent_records`, `email_verification_tokens`) set
  `$dateFormat` with the offset; without it Toronto times were stored as UTC, 4 hours off.
- **S5 — Interim component additions.** `zm-checkbox` is built standalone with the choice and stub variants
  (checkbox CRD, Implementation notes); the check variant and `zm-checkbox-group` come with their first
  screens. The form field gained `help` and `zm-button-link` `block`, both already in their CRDs.
- **S5 — The test suite's memory limit is 512 MB** (`phpunit.xml`): each test class asserting the contract
  generates the OpenAPI document once, and the suite outgrew PHP's 128 MB.
- **S5 — Baselines.** The footer's "Create an account" changes every signed-out page, and `/sign-in` gains
  its links, so every visual baseline was rewritten on win32 and linux (`--update-snapshots=all`).
  One a11y run in the Linux image timed out once on `discover-results-naomi` (dark, XL) and passed alone
  and in the next full run; watch it as S1's Discover flake was watched.
- **S7 — Verify answers 200 with the name, and signs no one in.** `POST /email/verify` returns
  `{ data: { name } }` (the design said 204) so "Email verified" can say "Thanks, Naomi." on the page
  the link returns to; a browser already signed in asks `/me` again. The token is checked only after
  the browser takes over, so a link preview cannot use it up. A missing token (422) shows as expired.
- **S7 — One resend endpoint for three callers.** `POST /email/verification-notification` serves the
  signed-in banner (no body), the expired page (`token`: the link's owner) and the sign-up page's
  "Resend the email" (`email`), always 202 `{ data: { accepted: true } }`. Earlier links are marked
  used, not deleted, so a revoked link still finds its owner. D6's 3 in 15 minutes counts per account,
  or per address for a guest; `api-e2e` raises it (`ZAMARO_RESEND_VERIFICATION_LIMIT`).
- **S7 — Components.** `zm-banner` and `zm-stamp` were built from their CRDs (alert, stamp) with
  `Banner.ts` and `Stamp.ts`; `zm-icon` gained `mail`. Inside the auth card, secondary buttons keep the
  paper outline instead of the stage's (button CRD note; `button.scss` was already over its 4 kB
  warning and grows by about 360 bytes). The checking state's inline spinner waits for `zm-spinner`.
- **S7 — Copy without a mock.** "Confirming your email…" for a guest; the status lines after a resend
  ("A new link is on its way to {email}. It works for 24 hours." on sign-up, "…to the email you signed
  up with…" on the expired page); "Sent" stays a minute on the banner, the expired page and sign-up.
- **S7 — e2e readiness.** `SignUpPage.open()` waits for focus in Full name (the app's own signal that
  it has taken over): under load the old networkidle wait let a click land before hydration.
  `VerifyEmailPage.openLink()` and Try again wait for the check's answer, and `waitForEmails()` polls
  Mailpit for 15 s like `waitForEmail()`.
- **S7 — `api-e2e` serves PHP as it is on disk.** Opcache is off for the CLI server, so a PHP edit
  made during an e2e run changes the API under it (ADR-0019 says it keeps its code; only
  `worker-e2e` does). Don't edit PHP while the suite runs.
- **S17 — `saved_artists.id`.** The e2e clock is frozen, so two saves share an instant; a new
  additive migration gives the table an identity that keeps them in the order they were made.
- **S17 — Copy without a mock.** "{n} saved · free or booked on {date}" after Check date, "{n} saved ·
  pick a date to see who’s free" without a search, and "See free dates for {name}".
- **S17 — Skeletons.** `zm-ticket-skeleton` is built and used on Saved artists; Discover's own
  skeleton markup moves to it later, so its loading baselines do not change here.
- **S17 — Ruth Adeyemi.** The empty state needs a booker who saved no one; `cast:booker` makes her once
  per run after the seed, since making her again re-hashes her password and ends her sessions.
- **S17 — Style restored.** S16's red tests had reformatted e2e page objects with Prettier's defaults;
  `889c5e1` restores them. Run Prettier in `e2e/` with
  `--config ../frontend/.prettierrc`.
- **S17 — Seen, not changed:** at LG the narrow ticket body also lets the "Free" badge reach the
  perforation, the same layout limit as the mid-word name breaks noted in S15.
- **S16 — The replay is in the store.** The design has `AuthService` ask `PendingIntentService` to
  replay; the `api` library knows nothing of saved artists, so `SavedArtistsStore` replays once a booker's
  ids load. The intent carries the name and pronoun for the toast.
- **S16 — Registering ends in a sign-in.** Verifying signs no one in (S2), so "registering and
  verifying" returns to the page as a guest with "Email verified", and the save lands at the sign-in.
- **S16 — Scenarios unchanged.** Guests now see hearts on Discover; `LineupSaved` already measures
  tickets with hearts, and `Lineup` stays the ticket composite without them.
- **S15 — Saved by artist id.** Cards and profiles gain `id` (and cards `pronoun`) so the toggle and
  the toasts need no extra lookup; the routes are `/saved-artists/{{artistId}}` as the design has them.
- **S15 — `firstSave` and `users.first_saved_at`.** The design shows "Saved artists are private" once,
  on a booker's first save; the API says when that is.
- **S15 — Scenarios.** `zm-ticket` and `zm-headliner` already had their slots, so they did not change;
  the existing `Lineup`, `Ticket` and `Headliner` scenarios stay the guest view, and `LineupSaved` is the
  signed-in lineup. The plan's "re-measure Ticket, Headliner, Lineup and Badge" ran with no flag.
- **S15 — Copy without a mock.** "Undo save {{name}}", "Couldn’t remove {{name}}. Try again." and "Your
  connection dropped, so {{she’s | he’s | they’re}} still saved.".
- **S15 — Seen, not changed:** at LG, the two-column ticket grid breaks long names mid-word ("MARCU S
  BELL TRIO") for guests and bookers alike; it predates M2 and is left for the ticket CRD's layout.
- **S14 — Abigail accepts the October terms in the seed**, as Naomi does; without a record the gate
  would stop her. `cast:booker` records the current terms unless `--terms` names another (D19).
- **S14 — A read for the marketing choice.** `GET /account/consents/marketing` joins the design's two
  POSTs, so the settings box can show the latest record.
- **S14 — The gate's routes.** `termsGuard` is on `/account` and `/account/security/mfa`, the private
  pages so far; `termsInterceptor` covers any other signed-in call. Discover and profiles are public and
  stay open.
- **S14 — The Email preferences section** arrives with the marketing box (the plan put it in S9); M7's
  reminder and review boxes stay hidden (D23).
- **S13 — The two-step-on state opens `/account`, not `/account#two-step`**: at XS the jump reaches the
  page's end, where the nav marks the last section once its pause ends, so the capture depended on
  timing.
- **S13 — One action, one field.** `ManageTwoFactor` holds the design's `DisableTwoFactor` and
  `RegenerateRecoveryCodes`; both endpoints take `code`, which is a TOTP code when it is six digits and
  a recovery code otherwise, as the dialog's one field asks.
- **S13 — The two-step-on state is reached in the browser**: no cast member has two-step sign-in on, so
  the route state answers `/me` with `mfaEnabled: true` (`setup: 'two-step-on'`).
- **S13 — Copy without a mock.** "We couldn’t get new recovery codes" and "Nothing changed; your codes
  still work. …" (the new-codes mock says its failed state matches Turn off's), and "Close" for the
  dialog's close button.
- **S13 — Components.** `zm-dialog` gains `description`, `icon`, `iconTone`, `danger` and `busy`, with the
  `DialogDanger` scenario; `zm-button` gains `danger`; `zm-icon` gains `key` and `lock-open` (their CRDs).
- **S12 — The QR code is an image from the API** (ADR-0021): the lint rules ban inserting markup, so
  `GET /account/two-factor/qr` serves the SVG for an `<img>`.
- **S12 — `zm-recovery-codes` is `zm-list variant="grid" ordered`**, as the list CRD specifies it; no
  new component or scenario.
- **S12 — The 202 for the code step.** `POST /session` and `POST /password/reset` answer 202 `{
  twoFactorRequired, email }` rather than the design's `SignInResult` type; the challenge marker lives
  10 minutes (the design gives no lifetime).
- **S12 — "Signing in as {email}."** comes from the sign-in page as navigation state; opened directly,
  the challenge page has no such line.
- **S12 — `/account/security/mfa` and `/account/sign-in/verify`** render in the browser only, as every
  `/account` path does; the setup page is behind `signedInGuard`.
- **S12 — Copy without a mock.** The emails, "That recovery code is wrong or was used. Enter another of
  your saved codes." with "Enter an unused recovery code", and the pause's line when the address is not
  known ("We’ve emailed the account owner").
- **S12 — `zm-badge` gains `success`** and `zm-icon` gains `copy`, `download` and `lock` (their CRDs).
- **S11 — The device list is `zm-list variant="device"`**, as the list CRD specifies it; the plan's
  `zm-device-list` and `DeviceList.ts` are its `List` scenario.
- **S11 — Session keys.** The list's `id` is the registry key (the SHA-256 of the session ID), which is
  not the session ID and cannot be turned back into one.
- **S11 — Captures pin the device rows.** Every spec signing in as Naomi or Abigail adds a session, so
  the account route states hide all rows but this device's and mask its line and the Password lead's
  count; the rows are proven in the settings spec with fresh bookers.
- **S11 — Times in query bindings keep their offset.** Laravel formats a Carbon binding without one, so
  the timestamptz comparison read Toronto times as UTC; `SessionRegistry` passes ISO 8601 strings.
- **S11 — Copy without a mock.** "Last active just now", "{n} min ago", "Unknown device", and the
  Password lead with no other session ("Leave these empty to keep your password.").
- **S10 — The confirm endpoint is public**, like email verification: the token is the proof and it
  signs no one in, so the link works in any browser. It shares the reset endpoints' limit (30 a minute
  per address). A guest who confirms goes to `/account`, signs in, and sees "Email changed" there.
- **S10 — `/me` carries `pendingEmail`**, so the Email section and the confirm card can name the new
  address after a reload or in the browser that asked.
- **S10 — The password form has one new-password field**, as the mock shows; the page sends it as its own
  confirmation, and the API still checks `passwordConfirmation` for other callers.
- **S10 — A password change emails the owner** (`PasswordChangedNotification`, as a reset does) and is
  audited as `auth.password_changed`; the design names only the audit entry.
- **S10 — "Your other devices", without a count.** The mock's "your other 2 devices" needs the session
  list, which arrives in S11.
- **S10 — Copy without a mock.** The two emails, "We sent a link to {new}. You sign in with {current}
  until you open it.", "Switching your sign-in to your new email…" and "Nothing changed. Ask for the
  change again to get a new link." for a guest, "Enter your current password to make this change.", and
  the banner's "Email changed" label with "You now sign in with {email}.".
- **S10 — `zm-button-link` gains `fragment`** (button CRD), for "Change email again".
- **S9 — Sections arrive with their slices.** `/account` has Profile and Church (or Contact) and the
  save bar. Email and Password join in S10, Signed-in devices in S11, Two-step sign-in in S12 and Email
  preferences (with the marketing box) in S14, each with the backend it needs; the plan listed the
  preferences, two-step and devices sections in S9. The nav lists only the sections on the page.
- **S9 — The save bar starts empty.** "Saved 2 min ago" needs a stored save time the frozen e2e clock
  cannot make sense of; the bar shows nothing until a save (form-layout CRD allows an empty status).
- **S9 — `serviceArea`, not `streetAddress`, for an address outside the area**, so the page can tell
  "outside the area" from "not found"; both show at Street address.
- **S9 — Which sections a save sends.** The name when it changed; the church when one was saved before
  or anything was typed into it; the contact phone likewise. A fresh booker can rename without a church.
- **S9 — `zm-save-bar` is `zm-form-actions`**, the form-layout CRD's name, with its `FormActions`
  scenario. `zm-form-section-skeleton` is not built yet: the loading state announces "Loading your
  settings…" without skeleton sections.
- **S9 — The "Saved" banner is the page's**, above the page head, not in the shell's banner region;
  an artist's reads only "Your settings are up to date."
- **S9 — Copy without a mock.** "Church address not found · not saved", the per-field summary lines
  ("Enter the church name", "Enter a full phone number", "Enter the typical attendance") and their
  messages, and "Enter your name."
- **S9 — Harvest Point's address** (8150 Main Street East, Milton, L9T 1A1, 905-555-0177, about 220
  people) is not in the mocks; Milton joins `CastRoutes`.
- **S9 — `AuthService.whenKnown()` and `signedInGuard`.** The first private route waits for the first
  `/me` (shared with the shell's), and `RenderMode.Client` lands with it (ADR-0017). `replace()` swaps in
  the renamed person.
- **S9 — The page heading's id is `settings-title`**: `account-title` is the account menu's.
- **S8 — The 410 names the link's account.** The expired reset mock says when the link was sent and
  where a new one goes, so `link-expired` gains `email` and `sentAt` for a reset link that existed; an
  unknown token names no one and the page offers only "Find who’s free" and sign-in. A guest's "Send a
  new link" there posts the named email to `/password/forgot`.
- **S8 — `pausedUntil` on the 429.** The sign-in card shows when sign-in resumes, so `sign-in-paused`
  carries it (Toronto time) beside `Retry-After`. Every try during a pause is audited as a denied sign-in.
- **S8 — Tests use another browser.** `UsesTheWebApp::withoutCookies()` drops the cookies a test set, so
  "every other session ends" signs in from a second browser instead of reusing the first one's cookie.
- **S8 — Reset limits** are `ZAMARO_FORGOT_PASSWORD_LIMIT_PER_HOUR` and
  `ZAMARO_PASSWORD_RESET_LIMIT_PER_MINUTE`, raised on `api-e2e`.
- **S6 — `failed_jobs` already existed** with the `uuid` column and the `database-uuids` driver from
  Laravel's skeleton, so no migration was needed. Horizon's supervisors keep `tries => 1`, which only
  applies to a job that sets none; `RetriesWithBackoff` sets 6 on every job and email.
- **S6 — Jitter is drawn when the job is queued.** Laravel writes `backoff()` into the payload at
  dispatch, so one job's five delays are fixed then; jobs queued together still spread out.
- **S6 — The request ID travels in the job.** Laravel's Context is serialised into every payload and
  restored when the worker picks the job up, so `ReportFailedJob` reads the queuing request's ID.
- **S6 — `Alert` and `AlertSeverity`.** `OnCallAlerter::raise(Alert)` takes the monitor-health design's
  value object (key, summary, severity, context); job failures are `job-failed`, Critical.
  `ErrorReporter::report()` takes the exception, request ID, release and a context map. Both ports and
  `Alert` live in `app/Contracts`; the fakes are in `Integrations/{ErrorTracking, Alerting}` and use
  `RedactSensitiveData::redact()`, now public.
- **S6 — What `i18n:check` reads.** Emails print only variables built from the catalogue
  (ADR-0019), so the check reads `copy()` (the `emails` namespace), `message()` and `@t` for keys,
  any letters left in a view once Blade comments, echoes, directives, tags and entities are set aside,
  and literals passed to `MailMessage` text methods. Frontend keys and text are the existing
  `zamaro/no-hardcoded-text` ESLint rule's job. The scanned folders are `zamaro.i18n.check.*`, so the
  test points them at fixtures.
- **S6 — Load and the 5 s waits.** A full e2e run made while the backend suite and PlantUML ran beside
  it failed 8 Discover and profile specs on 5 s waits for search answers; the same tree passed all 228
  alone. Run the e2e suite on a quiet machine.
- **S4 — The ESLint bans** cover `bypassSecurityTrust*` and `[innerHTML]`/`[outerHTML]`, inline
  templates included; nothing in the app needed an exception.

## Context

**What M1 leaves behind.**
- **API.** Laravel 11. `routes/api.php` is still empty, beside `api_public.php` and `health.php`. It has problem
  details (`NotFound`, `ValidationFailed`, `TooManyRequests`, `ServerError`), request IDs, JSON request logs,
  Scramble with `AssertsOpenApiContract`, and one `search` limiter.
- **Data.** Laravel's default `users`, `sessions` and `password_reset_tokens` tables, with no roles.
  - Cast accounts are `{slug}@cast.zamaro.test` with random passwords, so nobody can sign in.
  - There is no `churches` table: bookings store `church_name` and `church_city`.
- **Services and ports.** `ServiceArea` and `DistanceService` (Discovery), `AvailabilityService`, and
  `Contracts/{Geocoder, RoutingProvider}` with fakes. Sanctum and Mailpit are not set up.
- **Angular.**
  - `ThemeService` stores the theme on the device only, and `LastSearch` lives in memory.
  - There are two pages (`discover/`, `artist/`) and the `menu` dialog.
  - The `api` library has no `auth/` folder.
  - Each of the 25 `zm-*` components has a perf scenario. There is no `zm-toast`, because M1's S16 was optional.
- **e2e.** Read-only. The database is seeded once and the clock is frozen at Fri 9 Oct 2026 10:00. The routes
  manifest lists 4 states, all signed out.

**Deferred from M1 to M2:**
- `auth:sanctum` by default
- `EnsureJsonRequest` (415)
- log redaction
- tighter CORS
- no transfer-caching of personal data
- the profile Save toggle
- the signed-in top-bar mask

**Goal.** Guests become bookers who can:
- register and verify an email address
- sign in and recover access
- keep a church profile
- manage the account and two-step sign-in
- accept new terms
- save artists and see the shortlist

Underneath, M2 lays the foundations M3–M10 reuse: sessions, CSRF, authorisation, validation, rate limits,
field encryption, email and background jobs.

**Designs in scope:**
- `accounts/*`
- `security/manage-sessions-and-csrf` and `security/authorise-and-validate-requests`
- `security/limit-request-rates`: per-account limits and the bot challenge
- `security/protect-secrets-and-data`: encrypted fields and log redaction
- `privacy/record-consent`
- `notifications/send-transactional-emails`: the foundation only
- `operations/run-background-jobs`
- `user-experience/switch-theme`: the account preference

**Out of scope:**

| Item | Milestone |
|---|---|
| Booking emails, `email_messages`, bounces and the undeliverable banner (L2-063, L2-065.4) | M5 |
| The verified-email booking gate (L2-022.4) | M5 |
| `add-church` and the address snapshot (L2-024.1, .3) | M5 |
| The daily booking allowance (L2-077.3) | M5 |
| Admin MFA, the admin idle limit and the audit viewer | M3 |
| Reminder and review preferences | M7 |
| Data export and account deletion | M9 |
| DNS checks, the secrets manager, CI scans and real vendor adapters | M10 |

## Entry criteria and dependencies

- **M1 is complete.** S12–S16 are merged, and the `e2e/visual` and `e2e/a11y` suites exist. If those suites don't
  exist yet, build them first, as test-only work.
- **Branch.** Work on `feat/m2-accounts-and-sessions`, cut from `main`, with one commit per slice or smaller.
- **Slice loop.** Each slice follows M1's loop:
  1. Write the criteria.
  2. Write a red test.
  3. Build.
  4. Run the regression set. Add the perf test with `--fail-on-regression` whenever a `zm-*` component changes.
- **e2e now writes.** Visual and read-only specs use the seeded Naomi, Abigail and Tomi. Specs that change data
  use fresh bookers (D19).

## Decisions to make or confirm

Decisions marked "OK" need the user's approval before their slice starts. The others go ahead with the default
shown and are recorded in the slice's ADR or the design.

| # | Question (source) | Recommended default | OK |
|---|---|---|---|
| D1 | Argon2id memory and iterations (register-booker) | Laravel defaults (65,536 KiB, 4 passes, 1 thread); minimum cost in `testing` | OK (accepted default, 2026-10-10) |
| D2 | Bot challenge vendor (register-booker, limit-request-rates) | `Contracts/BotChallenge` with a fake until M10 | OK (accepted default, 2026-10-10); built in S5, with `BOT_CHALLENGE` in Zamaro Web |
| D3 | Bot provider unreachable (limit-request-rates) | Fail closed, with the usual challenge message | OK (accepted default, 2026-10-10); built in S5 |
| D4 | Breached-password vendor (sign-in-and-recover-access) | `Contracts/BreachedPasswordChecker`; the fake rejects a configured list; the HIBP range adapter in M10 | OK (accepted default, 2026-10-10); built in S5 (`zamaro.fakes.breached_passwords`) |
| D5 | TOTP library (sign-in-and-recover-access) | `pragmarx/google2fa` with `bacon/bacon-qr-code` (SVG), behind `Services/Accounts/TotpVerifier` | OK (accepted default, 2026-10-10); built in S12 (ADR-0021) |
| D6 | Limits on register, resend, forgot and reset (the designs only say "rate-limited") | Register 10/h per IP; resend 3/15 min per user; forgot 5/h per IP and per email; reset 30/min per IP | OK (accepted default, 2026-10-10); register built in S5, resend in S7 (per address for a guest) |
| D7 | Signed-in `api` limit (limit-request-rates) | 300/min per user; anonymous stays at 120/min per IP | OK (accepted default, 2026-10-10); built in S4 |
| D8 | Toast after a second 419 (manage-sessions-and-csrf; no mock) | "That didn't go through. Reload the page and try again." Error toast, stays until dismissed | OK (accepted default, 2026-10-10); built in S3 as kind "Failed", title "That didn’t go through.", text "Reload the page and try again." |
| D9 | "Your session ended" line before drafts exist (M5) | "Sign in again to carry on. Nothing you typed is lost." | OK (accepted default, 2026-10-10); built in S3 |
| D10 | Problem types for 401, 419 and the new cases | `unauthenticated`, `csrf-token-mismatch`, `link-expired` (410), `payload-too-large`, `unsupported-media-type`, `saved-artist-limit`, `terms-acceptance-required`, `sign-in-paused` (429). Bad credentials: 422 with `errors.credentials` | OK (accepted default, 2026-10-10); `unauthenticated` and `errors.credentials` built in S1, `csrf-token-mismatch` in S3 |
| D11 | Email-change link lifetime (manage-account-settings) | 24 hours, like the verification link | OK |
| D12 | `TrackSessionActivity` interval (manage-account-settings) | 5 minutes | OK (accepted default, 2026-10-10); built in S11 |
| D13 | Source of the approximate city (manage-account-settings) | `Contracts/IpLocator` with a fake table; unknown IPs show no city | OK (accepted default, 2026-10-10); built in S11 |
| D14 | Most recent search date: per browser or per account (view-saved-artists) | Per browser: `LastSearch` writes `localStorage['zamaro.lastSearchDate']` | OK |
| D15 | Does a new privacy-policy version trigger the terms gate? (record-consent) | No. Only Terms do (L2-080.3); the privacy version is recorded at registration | OK; built in S14 |
| D16 | Sending domain and From address (send-transactional-emails) | `Zamaro <hello@zamaro.ca>` on `zamaro.ca`; DNS in M10 | OK (accepted default, 2026-10-10); built in S5 (ADR-0019) |
| D17 | Backoff intervals (email and jobs designs) | `tries = 6`; delays of 10, 30, 90, 270 and 810 s, ±10% jitter | OK (accepted default, 2026-10-10); built in S6 |
| D18 | Queue names and process counts (run-background-jobs) | `high`, `notifications`, `default`; one process each locally | OK (accepted default, 2026-10-10) |
| D19 | How e2e specs that change data get users | `cast:booker {email} [--church] [--saved=…] [--terms=…]`: refused in production, run through `docker compose exec`. Registration is still tested through the UI | OK (accepted default, 2026-10-10); `{email}` built in S1, the options join with their slices |
| D20 | Toast when saving the theme fails (switch-theme) | None. The device keeps the choice, and the next toggle reconciles | |
| D21 | Email on two-step changes (mocks say "We emailed…"; the design is silent) | Add `TwoStepSignInChangedNotification` for on, off and new codes; update the design | OK; built in S12 (on), S13 (off, new codes) |
| D22 | M2 actions call `RecordAuditEntry`, which is M3 | Add the append-only `audit_entries` table and the action in S1; the viewer stays in M3 | OK (accepted default, 2026-10-10) |
| D23 | Mock parts that belong to later screens | Hide `#data` and `#delete` (M9), the reminder and review boxes (M7), "Your bookings" (M5), and the artist's Dashboard item and request count (M4/M5). Visual tests mask them | OK |
| D24 | The saved card's "Request" link (`/book` is M5) | Until M5 it links to `/artists/{slug}?date=…` | OK |
| D25 | Street-address type-ahead source (manage-church-profile) | A plain field until the geocoder vendor (M10) | |
| D26 | Cross-user suite fails on a route with no fixture (L2-074.3), against "no architecture tests" | Keep it: L2-074.3 and the AGENTS.md tree both name it, and every case asserts behaviour | OK (accepted default, 2026-10-10); built in S4 |
| D27 | Raw-SQL lint tool (authorise-and-validate) | Larastan with a custom PHPStan rule against non-literal `DB::raw`, `select`, `statement` and `*Raw` | OK (accepted default, 2026-10-10); built in S4 at level 0 |
| D28 | Cast sign-in password | `ZAMARO_CAST_PASSWORD` for Naomi, Abigail and Tomi, seeded only in `local`, `testing` and `e2e` | OK (accepted default, 2026-10-10) |

## Design conflicts and their resolutions

- **Folders (ADR-0007).** The designs' `features/account`, `features/saved` and `shared/saved` map to:
  - pages: `sign-in`, `sign-up`, `verify-email`, `forgot-password`, `reset-password`, `account`, `confirm-email`,
    `accept-terms`, `mfa-setup`, `mfa-challenge`, `saved`
  - dialogs: `account-menu`, `two-step-code`
  - `api/lib/auth/`: auth, guards, interceptors and the pending intent
  - `app/shared/`: `SavedArtistsStore`

  Routes keep the designs' paths. S10, S12 and S14 add their new page folders to the AGENTS.md tree.
- **Class names.** `RegisterPage` becomes `SignUp`, `SignInPage` becomes `SignIn`, and
  `TwoStepCodeDialogComponent` becomes `TwoStepCode`.
- **Current user.** The designs use both `AuthService` and `CurrentUserStore`, and three resource and controller
  names (`CurrentUserResource`, `MeResource`, `MeController`). The plan keeps one of each:
  - `AuthService`
  - `CurrentUserResource`
  - `Api\V1\Accounts\MeController`, serving `GET /api/v1/me` and `PATCH /api/v1/me/preferences`

  S1 records this in an ADR on current-user names and updates the three designs that use the other names.
- **Ports in `app/Contracts` (ADR-0002).** `BotChallengeVerifier` moves out of `App\Services\Security` and becomes
  `Contracts/BotChallenge`. `BreachedPasswordChecker`, `IpLocator`, `OnCallAlerter` and `ErrorReporter` live in
  `Contracts` too.
- **Namespace.** `App\Actions\Account\SaveChurch` becomes `Actions\Accounts\SaveChurch`.
- **Default tables.** Laravel's `password_reset_tokens` and `sessions` tables are unused, so S0 drops them.
  - S8 recreates `password_reset_tokens(user_id, token_hash, expires_at, used_at)`.
  - Sessions live in Redis plus `user_sessions`.
- **Retries.** The email design says `tries = 5`, but L2-065.2 and L2-092.1 mean one attempt plus 5 retries.
  Use `tries = 6` through `RetriesWithBackoff`, and fix the email design.
- **403 or 404.** manage-account-settings returns 403 to a booker on `PUT /account/contact-phone`, but L2-074.1
  requires 404. Use `role:artist`, which returns 404, and fix the design.
- **Saved date.** view-saved-artists reads the date from a localStorage `SearchStore`. M1's `LastSearch` holds
  it in memory, so `LastSearch` persists it (D14).
- **Existing services.** `ServiceArea` and `DistanceService` already exist; `SaveChurch` reuses them.
- **Mock times the frozen clock can't produce.** "after 10:57 a.m.", "until 11:31 a.m.", "Last active 2 hours ago"
  and "Saved 2 min ago". Specs assert the computed values; visual tests mask these spans.
- **Footer.** When signed in, the footer replaces "Your account" with "Naomi Fraser", her church and "Saved
  artists (3)".

## Slices

### S0 — Groundwork (infra and test-only, outside ATDD)
- **Build:**
  - **Sanctum.** Install `laravel/sanctum` ^4 with `statefulApi()`; read the stateful domains from
    `ZAMARO_WEB_ORIGINS`.
  - **Sessions.** Driver `redis`, cookie `zamaro_session`, `http_only`, `same_site=lax`, `secure` from env,
    `lifetime=10080`.
  - **Old tables.** Drop the default `sessions` and `password_reset_tokens`.
  - **Horizon.** Add supervisors for `high`, `notifications` and `default`.
  - **Mail.** Add a pinned `mailpit` service (SMTP :1025, API :8025). `api`, `api-e2e` and `worker` send mail over
    `smtp`.
  - **Redis.** Give `api-e2e` its own Redis prefix.
  - **Proxy.** Proxy `/sanctum` alongside `/api` in `proxy.conf.json` and in the SSR server.
  - **e2e fixtures.** Add `mailbox.ts` (Mailpit), `accounts.ts` (API sign-in to a `storageState`, plus unique
    addresses) and `totp.ts`. `RouteState` gains `signedInAs?`, and global setup clears Mailpit.
- **Verify:** the M1 suites stay green, and `:8025/api/v1/info` answers.
- **ADR: same-origin cookie sessions.** It covers Sanctum SPA mode, Redis sessions, the cookie names, the
  dropped tables, and why there are no bearer tokens.

### S1 — Sign in
- **L2:** 023.1, 023.2, 072.2, 073.1, 089.3, 108.1/.3.
- **Behaviour:**
  - Naomi opens `/sign-in?returnUrl=…abigail-mensah…`, enters `naomi.fraser@riversidecc.ca` and her password, and
    lands back on Abigail's profile.
  - `GET /api/v1/me` returns `initials: "NF"`, `roles: ["booker"]`, `emailVerified: true`, `themePreference: null`
    and `termsAcceptanceRequired: false`, with `Cache-Control: private, no-store`.
  - A wrong password and an unknown email get the same 422. The page shows "Couldn’t sign you in" and "Email or
    password is incorrect.", and clears the password. An unknown email is checked against a dummy hash, so both
    take the same time.
  - While the request is pending the button reads "Signing in…". A 500 shows "We couldn’t sign you in".
  - `zamaro_session` is `HttpOnly`, `Secure` and `SameSite=Lax`, and its ID changes at sign-in. Passwords are hashed
    with Argon2id.
- **Tests first:**
  - `tests/Feature/Accounts/{SignInTest, CurrentUserTest}.php`
  - `e2e/specs/accounts/sign-in-and-recover-access.spec.ts`
  - `e2e/pages/sign-in.page.ts`
- **Build:**
  - **Backend.**
    - Migrations: `roles` and `role_user` (`Role` enum), and `audit_entries` (D22).
    - `SessionController@store` and `MeController@show`, with `SignInRequest`.
    - Actions `AttemptSignIn`, `StartSession` and `Audit/RecordAuditEntry`.
    - `CurrentUserResource`.
    - `SetCachePolicy`, which sends `private, no-store` on the `api.php` group.
  - **Frontend.**
    - `api/lib/auth/{auth.service, auth-api, provide-auth}.ts`, with the `AUTH_API` token and
      `withXsrfConfiguration`.
    - An in-memory fake.
    - `pages/sign-in/`.
- **ADR:** current-user names.
- **Components:**
  - `zm-auth-card` (the "Admit one" card on 9 pages) → `AuthCard.ts`
  - `zm-error-summary` → `ErrorSummary.ts`
- **Route states:** `/sign-in` → `sign-in/default.html`.

### S2 — Signed-in header, account menu and sign-out
- **L2:** 023.5, 024.2 (initials and name), 099, 101.
- **Behaviour:**
  - After hydration the header shows "NF", named "Account menu for Naomi Fraser".
  - The menu lists "Naomi Fraser", her email, Account settings and Sign out. "Your bookings" is hidden (D23).
  - Tab moves through the menu. Escape returns focus to the avatar.
  - Sign out ends the session on the server: the old cookie gets 401 from `/me`. The header shows "Sign up" again.
  - The server-rendered HTML never contains "Naomi Fraser".
- **Tests first:**
  - `Accounts/SignOutTest.php`
  - the sign-in spec
  - `e2e/pages/account-menu.dialog.ts`, plus a `shell.ts` update
- **Build:**
  - **Backend.** `SessionController@destroy` with `SignOut`, which invalidates the session and rotates the token.
  - **Shell.** The shell reads `AuthService.currentUser()`, which loads `/me` in the browser only.
  - **Menu.** `dialogs/account-menu/` uses CDK Overlay.
  - **Footer.** The footer column switches to the signed-in user.
  - **Rendering.** Private routes use `RenderMode.Client`.
  - **Transfer cache.** It skips `/api/v1/me`, `/api/v1/account/**` and `/api/v1/saved-artists/**`.
- **ADR: server rendering and personal data.** SSR forwards no cookies, and nothing personal is transfer-cached.
- **Components:**
  - `zm-avatar` → `Avatar.ts`.
  - The `zm-top-bar` account slot → a new `TopBarSignedIn.ts`.
  - The `zm-menu` `menu__who` header → re-measure `Menu`.
- **Route states:** both Discover states, signed in as `naomi`. Remove the M1 mask.

### S3 — CSRF and session limits
- **L2:** 073.2, 073.3, 109.2.
- **Behaviour:**
  - `DELETE /api/v1/session` without `X-XSRF-TOKEN` gets 419 `csrf-token-mismatch`, and Naomi stays signed in. The
    same holds for every mutating `/api/v1` call.
  - After a 419 the app fetches `/sanctum/csrf-cookie` and retries once. A second 419 shows the D8 toast.
  - A session idle for 7 days, or open for 30, gets 401. The app goes to `/sign-in?returnUrl=…&ended=1`, which
    shows "Your session ended" (D9).
- **Tests first:**
  - `Security/{CsrfProtectionTest, SessionLifetimeTest}.php`, using time travel
  - `e2e/specs/security/manage-sessions-and-csrf.spec.ts`, which clears the session cookie
- **Build:**
  - **Backend.** `EnforceAbsoluteSessionLifetime`, `SessionLifetimePolicy`, and `auth.started_at` stored at sign-in.
  - **Frontend.** The `csrf-recovery` and `session-expired` interceptors in `api/lib/auth`, and `ToastService` in
    `app/shared`.
- **Components:**
  - `zm-toast` → `Toast.ts`
  - `zm-toast-region` (at most 3, newest first) → `ToastRegion.ts`
- **Route states:** `/sign-in?ended=1` → `sign-in/expired.html`, with the draft line masked.

### S4 — The request gate
- **L2:** 074.1, 074.3, 075.1, 075.2, 075.4, 077.1, 077.2 (per account), 079.3, 095.2.
- **Behaviour:**
  - `api.php` routes require `auth:sanctum` by default.
  - A booker on a `role:artist` route gets 404.
  - A body of 1,048,577 bytes gets 413; a `text/plain` body gets 415.
  - The 121st anonymous request in a minute from one IP gets 429 with `Retry-After`.
  - A signed-in booker's 31st search in a minute gets 429 from any IP.
  - CORS allows only `ZAMARO_WEB_ORIGINS`, with credentials.
  - Logs show `password`, `current_password`, `challengeToken` and `x-xsrf-token` as `[REDACTED]`.
- **Tests first:**
  - `Security/{CrossUserAccessTest, RequestValidationTest, AnonymousRateLimitTest}.php`, with
    `route-ownership-fixtures.php` (D26)
  - `Operations/LogRedactionTest.php`
  - new cases in `ApiConventionsTest` and `SearchRateLimitTest`
- **Build:**
  - Middleware: `EnsureJsonRequest`, `LimitRequestBodySize` and `EnsureUserHasRole`.
  - The `api` limiter and the per-user search limit; the e2e API raises the limit.
  - `config/cors.php`.
  - `Logging/{RedactSensitiveData, ApplyRedaction}`.
  - CI: Larastan with the raw-SQL rule (D27), and an ESLint ban on `bypassSecurityTrust*` and `[innerHTML]`.

### S5 — Register a booker, with consent
- **L2:** 022.1, 022.2, 072.1, 077.4, 080.1, 080.2, 108.
- **Behaviour:**
  - A guest fills in Full name, Email and Password, then ticks "I accept Zamaro’s terms of use and privacy policy".
    They leave "Email me about new artists near my church" unticked.
  - "Create account" changes to "Creating account…", then the page shows "Check your email to finish signing up".
  - Mailpit holds the verification email, with HTML and text parts.
  - Three consent rows are written: Terms 2026-10, PrivacyPolicy 2026-10 and MarketingEmail false. Each records
    the time, IP and user agent.
  - Registering `naomi.fraser@riversidecc.ca` again shows the same page and changes nothing. Naomi gets "Someone
    tried to sign up with your email".
  - Field errors:
    - "This one has 9 characters. Use at least 12."
    - "Accept the terms and privacy policy to create an account."
    - The summary reads "Fix 2 things to continue".
  - A failed challenge shows "We couldn’t check that you’re a person" and keeps every value.
  - Stale document versions get 409.
- **Tests first:**
  - `Accounts/RegisterBookerTest.php`, `Privacy/RecordConsentTest.php` and `Security/BotChallengeTest.php`.
  - `e2e/specs/accounts/register-booker.spec.ts`. The page object forces a `fail` token through `page.route`.
  - `e2e/pages/sign-up.page.ts`.
- **Build:**
  - **Migrations.** `email_verification_tokens`, `legal_documents` and `consent_records` (append-only).
  - **Registration.** `RegistrationController` (returns 202), `RegisterBookerRequest`, `Rules/PasswordPolicy` and
    `RegisterBooker`.
  - **Consent.** `RecordConsent`, `LegalDocumentRegistry`, and a public `LegalDocumentController`.
  - **Bot challenge.** `VerifyBotChallenge` middleware, with the `BotChallenge` and `BreachedPasswordChecker`
    ports and their fakes.
  - **Email.** The `TransactionalNotification` base class with `VerifyEmailNotification` and
    `DuplicateSignUpNotification`. Views sit in `resources/views/emails/` and copy in `resources/i18n/en/emails.json`.
  - **Frontend.** `pages/sign-up/`, the `consent` service, and `api/lib/auth/bot-challenge.ts`, whose fake
    resolves `pass`.
- **ADR: email foundation.** It covers Mailpit, Markdown mail built from the catalogue, the base class and the From
  address (D16).
- **Components:** `zm-checkbox` (`.choice`) → `Checkbox.ts`.
- **Route states:** `/sign-up` → `sign-up/default.html`.

### S6 — Email delivery rules and failed jobs
- **L2:** 063.2 (both parts, no card data), 065.2, 092.1, 111.1 (emails).
- **Behaviour:**
  - If the mail transport throws, `VerifyEmailNotification` retries on `notifications` after about 10, 30, 90, 270
    and 810 s.
  - After the 6th failed attempt the job is in `failed_jobs`, and `ReportFailedJob` calls `ErrorReporter` and
    `OnCallAlerter` with the job name and request ID.
  - `php artisan i18n:check` fails on a literal "Welcome" in an email view, or on a missing key, and names the file
    and line.
- **Tests first:** `Operations/BackgroundJobFailureTest.php`, `Notifications/EmailDeliveryTest.php` and
  `UserExperience/TranslationCheckTest.php`.
- **Build:**
  - `Jobs/Concerns/RetriesWithBackoff` (D17) and `ReportFailedJob`.
  - The `OnCallAlerter` and `ErrorReporter` ports with fakes.
  - `failed_jobs` with the `database-uuids` driver.
  - `CheckTranslationsCommand`, run in `.ci/lint.sh`.
  - Fix both designs to `tries = 6`. `DueWorkCommand` waits for M5.

### S7 — Verify the email address
- **L2:** 022.3. The verified-email booking gate (L2-022.4) waits for M5.
- **Behaviour:**
  - The link opens `/verify-email?token=…&returnUrl=/`. The page shows "Checking your link", then goes to
    Discover, where the banner reads "Email verified" and "Thanks, Naomi. You can send booking requests now." It
    stays for one page.
  - A used, unknown or expired token gets 410. The page shows "This link has expired" and "Send a new link".
  - Until the address is verified, every page shows a banner with no close button: "Verify your email" and "We
    sent a link to {email}. You need it to send requests.", with a Resend email action.
  - After a resend the banner reads "A new link is on its way to {email}. It works for 24 hours.", and the action
    shows "Sent" for a minute. Earlier links stop working.
- **Tests first:**
  - `Accounts/VerifyEmailTest.php`
  - the register spec
  - `e2e/pages/verify-email.page.ts`
- **Build:**
  - `EmailVerificationController`, with `VerifyEmail` and `ResendVerificationEmail`.
  - `pages/verify-email/`.
  - The shell's banner region.
- **Components:** `zm-banner` → `Banner.ts`.
- **Route states:** `/verify-email?token=e2e-unknown` → `verify-email/expired.html`.

### S8 — Lockout and password reset
- **L2:** 023.3, 023.4, 072.4, 077.4.
- **Behaviour:**
  - A 6th sign-in try within 15 minutes, for any address, shows "Sign-in is paused for 15 minutes" with the end
    time and "If this wasn’t you, the account owner has been emailed." A real owner gets one
    `AccountLockedNotification` per pause.
  - `/forgot-password` runs the bot challenge and always ends on "Check your email".
  - `/reset-password/:token` shows "Checking your reset link…", then "Choose a new password".
    - Mismatched passwords show "The two passwords don’t match. Type the new one again."
    - Saving shows "Password changed". This device is signed in, every other session ends, and the user gets
      `PasswordChangedNotification`.
    - A link more than 60 minutes old, or already used, shows "This link has expired".
- **Tests first:**
  - `Accounts/{SignInLockoutTest, PasswordResetTest}.php`
  - the sign-in spec
  - `e2e/pages/{forgot-password, reset-password}.page.ts`
- **Build:**
  - Migrations: `password_reset_tokens` (the design's shape) and `user_sessions`.
  - Services: `SignInThrottle` and `SessionRegistry`. `StartSession` now registers each session.
  - `PasswordResetController` (forgot, `reset/check`, reset), with `SendPasswordResetLink` and `ResetPassword`.
  - The two pages.
- **Route states:** `/forgot-password` → `forgot-password/default.html`.

### S9 — Account settings: profile, church and contact phone
- **L2:** 001.1, 001.2, 001.4, 004.1, 024.2, 025.4, 079.2, 105, 108.
- **Behaviour:**
  - `/account` shows "Account settings" and "Naomi Fraser · Riverside Community Church", with the settings nav,
    Profile, Church, Email preferences (D23 boxes), the Two-step and Devices sections, and the save bar.
  - Saving 2150 Lakeshore Road, L7R 1A3 shows "Saved" and "Your settings are up to date. Bookings already sent keep
    the church address they were made with."
  - Rejected saves store nothing and keep every value:
    - An Ottawa address: "Zamaro serves churches within 200 km of Toronto." under the summary "Your church
      wasn’t saved".
    - An unknown address: "We couldn’t find that address. Check the street and postal code."
    - A bad postal code: "Enter a postal code like L7R 1A3, with six characters."
  - `churches.phone` is stored as `v1:` ciphertext.
  - The menu and the footer show "Riverside Community Church", and Discover pre-fills Burlington at 120 km.
  - Abigail sees Contact instead of Church: "Churches see it only once a booking is confirmed. It’s never on your
    public profile." When Naomi calls `PUT /account/contact-phone`, she gets 404.
- **Tests first:**
  - `Accounts/{ManageChurchProfileTest, AccountProfileTest, ArtistContactPhoneTest}.php`
  - `Security/FieldEncryptionTest.php`
  - `e2e/specs/accounts/{manage-church-profile, manage-account-settings}.spec.ts`
  - `e2e/pages/account.page.ts`
- **Build:**
  - **Migrations.** `churches` and `artists.contact_phone`.
  - **Encryption.** `FieldEncrypter` (aes-256-gcm, versioned keys) and the `EncryptedField` cast.
  - **Fakes and rules.** `FakeGeocoder` gains street addresses; add a `NorthAmericanPhone` rule.
  - **Controllers.** `ChurchController` (`role:booker`) with `SaveChurch` and `ChurchResource`;
    `AccountProfileController`; and `ArtistContactController` (`role:artist`).
  - **Frontend.** `pages/account/` as one reactive form, the `account` service, and the Discover pre-fill.
- **ADR: field-encryption keys.** Rotation stays `<TO SUPPLY>` until M10.
- **Components:**
  - `zm-form-section` → `FormSection.ts`
  - `zm-save-bar` → `SaveBar.ts`
  - `zm-settings-nav` → `SettingsNav.ts`
- **Route states:**
  - `/account` signed in as `naomi` → `account/default.html`
  - `/account` signed in as `abigail` → `account/artist.html`

### S10 — Change email and password
- **L2:** 025.1, 025.2.
- **Behaviour:**
  - Naomi asks for `naomi@riversidecc.ca` and confirms with her current password. Her old address gets a notice
    and the new one gets a link. Her email stays the same until she opens the link.
  - Asking for an address someone already uses looks exactly the same.
  - The link opens "Confirming your new email", then "Email changed. You now sign in with naomi@riversidecc.ca."
  - A used or expired link, or an address taken in the meantime, shows "This link has expired" and "Change email
    again".
  - A new password ends every other session and gives the current session a new ID.
- **Tests first:**
  - `Accounts/{ChangeEmailTest, ChangePasswordTest}.php`
  - the settings spec
  - `e2e/pages/confirm-email.page.ts`
- **Build:**
  - `users.pending_email` and `email_change_tokens`.
  - `AccountEmailController`, with `RequestEmailChange` and `ConfirmEmailChange`.
  - `AccountPasswordController`, with `ChangePassword`.
  - `pages/confirm-email/`.
- **Route states:** `/account/email/confirm?token=e2e-unknown` → `confirm-email/expired.html`.

### S11 — Signed-in devices
- **L2:** 025.3, 074.2.
- **Behaviour:**
  - The list starts with "Chrome on Windows · Burlington, ON · This device · active now", then other devices such as
    "Safari on iPhone".
  - "End session" signs that device out at once, with no confirmation. Its next call gets 401.
  - Another user's session ID gets 404.
  - Raw session IDs and full IP addresses are never returned.
- **Tests first:**
  - `Accounts/SignedInDevicesTest.php`, with a cross-user fixture
  - the settings spec, run in two browser contexts
- **Build:**
  - `AccountSessionController`, with `EndSession` and `SessionResource`.
  - `TrackSessionActivity` (D12).
  - The `IpLocator` port and its fake.
  - A device-label parser.
- **Components:** `zm-device-list` → `DeviceList.ts`.

### S12 — Two-step sign-in: turn on and sign in with a code
- **L2:** 072.3, 072.4.
- **Behaviour:**
  - "Turn on two-step sign-in" opens `/account/security/mfa`, which shows the QR code and the key.
  - A wrong code shows "That code didn’t match. Codes change every 30 seconds; enter the one showing now."
  - A right code shows "Save your recovery codes" (10 of them, with copy and download), sends the D21 email, and the
    section reads "On".
  - The next sign-in goes to `/account/sign-in/verify` ("Enter your code"). "Use a recovery code instead" accepts
    each code once.
  - A wrong code shows "That code is wrong or has expired. Enter the code your app shows now." It counts toward the
    5-in-15 lockout.
- **Tests first:**
  - `Accounts/{EnableTwoFactorTest, TwoFactorChallengeTest}.php`
  - `e2e/specs/accounts/two-step-sign-in.spec.ts`: the page object reads the key, and `totp.ts` computes the codes
  - `e2e/pages/{mfa-setup, mfa-challenge}.page.ts`
- **Build:**
  - Migrations: `users.{mfa_enabled, two_factor_secret (encrypted), two_factor_confirmed_at}` and `recovery_codes`.
  - `TwoFactorController` (begin, confirm).
  - `SessionController@twoFactor`, with `CompleteTwoFactorChallenge`.
  - `TotpVerifier`.
  - The two pages.
- **ADR:** TOTP library.
- **Components:** `zm-recovery-codes` → `RecoveryCodes.ts`.
- **Route states:**
  - `mfa-setup/default.html`, with the QR code and key masked
  - `mfa-challenge/default.html`

### S13 — Two-step sign-in: turn off and new recovery codes
- **L2:** 072.5.
- **Behaviour:**
  - "Turn off" opens "Turn off two-step sign-in?", with "Keep it on" first. It needs a current code or an unused
    recovery code.
  - A wrong code shows "That code is wrong or has expired. Enter the code your app shows now, or an unused recovery
    code." It counts toward the lockout.
  - "New recovery codes" opens "Get new recovery codes?", then "Save your new recovery codes". All earlier codes
    stop working.
  - Escape returns focus to the button that opened the dialog.
  - Each change emails Naomi (D21) and is audited.
- **Tests first:**
  - `Accounts/ManageTwoFactorTest.php`
  - the two-step spec
  - `e2e/pages/two-step-code.dialog.ts`
- **Build:**
  - `TwoFactorController@{destroy, recoveryCodes}`, with `DisableTwoFactor` and `RegenerateRecoveryCodes`.
  - `dialogs/two-step-code/`, built on `zm-dialog`.
- **Route states:** `/account` with two-step sign-in on → `account/two-step-on.html`.

### S14 — Accept updated terms, and the marketing choice
- **L2:** 080.3, 080.4.
- **Behaviour:**
  - Tomi Oduya last accepted Terms 2026-03. Every private page, and every API call (409
    `terms-acceptance-required`), sends him to `/account/accept-terms`.
  - The page shows "We’ve updated our terms", the three changes, and "Terms of use, version 2026-10, from Thu 8 Oct
    2026."
  - "Accept and continue" changes to "Accepting…", records the acceptance and returns him to where he was going.
    Sign out is the only other way out.
  - Accepting a stale version gets 409, and the page reloads with the new one.
  - Ticking "New artists near my church" appends a `settings` consent record and keeps the earlier ones.
- **Tests first:**
  - `Privacy/{AcceptNewTermsTest, MarketingConsentTest}.php`
  - `e2e/specs/privacy/record-consent.spec.ts`
  - `e2e/pages/accept-terms.page.ts`
- **Build:**
  - The `EnsureCurrentTermsAccepted` middleware, on every `api.php` route except sign-out, `/me`, the accept
    endpoint and the legal documents.
  - `ConsentController`, with `AcceptCurrentTerms`.
  - `terms.guard` and `terms.interceptor`.
  - `pages/accept-terms/`.
- **Route states:** `/account/accept-terms`, signed in as `tomi` → `accept-terms/default.html`.

### S15 — Save an artist
- **L2:** 006, 012.1, 026.1, 026.2, 026.4, 026.5, 109.
- **Behaviour:**
  - Luz Viva's pressed heart reads "Remove Luz Viva from your saved artists". Elijah's reads "Save Elijah Park to
    your saved artists".
  - Saving Elijah takes the count from 3 to 4 and shows "Saved Elijah Park" with "Your saved count is now 4." and
    Undo. The toast lasts 5 s and pauses on hover.
  - Unsaving shows "Removed Elijah Park" with "He’s off your saved list. Your count is now 3." The pronoun comes
    from `Pronoun`.
  - A booker's first-ever save shows "Saved artists are private".
  - At 200 saved, the toast reads "You can save up to 200 artists." and nothing changes.
  - If a save fails, the heart reverts and "Couldn’t save {name}. Try again." stays until dismissed.
  - The artist profile shows a "Save"/"Saved" button.
  - Artists don't see the toggle. Saving a suspended artist gets 404.
- **Tests first:**
  - `Accounts/SaveArtistTest.php`, with a cross-user fixture
  - `e2e/specs/accounts/save-artist.spec.ts`
  - `e2e/pages/toasts.ts`, plus `lineup.ts` and `artist-profile.page.ts` gaining the toggle
- **Build:**
  - **Migration.** `saved_artists`, unique on `(user_id, artist_id)` and indexed on `(user_id, created_at desc)`.
  - **Backend.**
    - `SavedArtistController` (`role:booker`).
    - `SaveArtist`, which locks the user row and inserts with `ON CONFLICT DO NOTHING`.
    - `UnsaveArtist`.
    - `SavedArtistStateResource`.
  - **Frontend.** `SavedArtistsStore`, the `saved-artists` service, and the header Saved link.
- **Components:**
  - `zm-save-toggle` → `SaveToggle.ts`
  - save slots on `zm-ticket` and `zm-headliner`, and the `zm-badge` count → re-measure `Ticket`, `Headliner`,
    `Lineup` and `Badge`
- **Route states:** Discover, signed in as `naomi`, now matches the mock's hearts.

### S16 — Guest save through sign-in or sign-up
- **L2:** 026.3.
- **Behaviour:**
  - A guest presses Save on Hosanna Collective and goes to `/sign-in?returnUrl=…`.
  - After signing in, or registering and verifying, the guest returns to the same lineup with Hosanna saved and the
    toast showing.
  - A newer pending save replaces an older one. It is kept in `sessionStorage` only.
- **Tests first:** guest cases in `save-artist.spec.ts`.
- **Build:** `pending-intent.service.ts`, which `AuthService` replays after sign-in and after verification.

### S17 — Saved artists list
- **L2:** 027.1–4, 105.
- **Behaviour:**
  - `/saved` shows "Saved artists" and "3 saved · free or booked on Sat 14 Nov, your last search".
  - Each card shows when it was saved, "Free Sat 14 Nov" and "Request" (D24):
    - Abigail: "Saved Wed 7 Oct"
    - Hosanna: "Saved Sun 27 Sep"
    - Luz Viva: "Saved Sat 12 Sep"
  - Picking a date under "Who’s free on" and pressing "Check date" re-checks every card. Booked artists show
    "Booked {date}" and "See free dates".
  - A suspended artist is left out of the list and the count.
  - An empty list shows "No saved artists yet" and "Find who’s free".
  - While loading, skeleton tickets show. A failed load shows "We couldn’t load your saved artists".
- **Tests first:**
  - `Accounts/ViewSavedArtistsTest.php`
  - `e2e/specs/accounts/view-saved-artists.spec.ts`
  - `e2e/pages/saved.page.ts`
- **Build:**
  - `SavedArtistController@index` with `ListSavedArtistsRequest`.
  - `ListSavedArtists`: one `freeArtistIds` call, with distances from the church.
  - The card and list resources.
  - `LastSearch` persists the date (D14).
  - `pages/saved/`.
- **Components:** `SavedLineup`, a composite of 200 tickets, tuned to render in 100–300 ms.
- **Route states:**
  - signed in as `naomi` → `saved/default.html`
  - a fresh booker → `saved/empty.html`

### S18 — Theme saved to the account
- **L2:** 104.2.
- **Behaviour:**
  - Choosing dark sends `PATCH /api/v1/me/preferences` with `dark`.
  - A second signed-in browser that is light on the device switches to dark after `/me`, and keeps dark on the
    device.
  - If the account has no theme, the device's value is saved to the account.
  - `"blue"` gets 422.
  - A guest's choice stays on the device.
- **Tests first:** `UserExperience/ThemePreferenceTest.php` and new cases in `switch-theme.spec.ts`.
- **Build:**
  - `users.theme_preference` (`varchar(5)` with a check constraint) and the `ThemePreference` enum.
  - `MeController@updatePreferences`, with `UpdatePreferencesRequest` and `UpdateUserPreferences`.
  - `ThemeService` reconciles with `AuthService`.

## Vendor ports and fakes

| Port (`app/Contracts`) | Fake | Behaviour | Real adapter |
|---|---|---|---|
| `BotChallenge` | `FakeBotChallenge` | Passes every token except `fail`; an `unreachable` switch for D3 | M10 |
| `BreachedPasswordChecker` | `FakeBreachedPasswordChecker` | Rejects the configured list | M10 (HIBP range API) |
| `Geocoder` (exists) | `FakeGeocoder`, extended | Knows Riverside and an Ottawa address; returns null for unknown addresses | M10 |
| `IpLocator` | `FakeIpLocator` | Local IPs map to "Burlington, ON" or "Hamilton, ON" | M10 |
| `OnCallAlerter`, `ErrorReporter` | Fakes | Record each call after redaction | M10 |
| Mail transport | Laravel `smtp` → Mailpit | e2e reads the Mailpit API | M10 |

In the browser, the `BOT_CHALLENGE` fake resolves `pass`. A fake bound in production throws at boot (ADR-0002).

## Seed data additions (idempotent)

- **Naomi Fraser:**
  - Booker, `naomi.fraser@riversidecc.ca`, verified, two-step sign-in off, marketing email off, no theme preference.
    She has accepted Terms 2026-10.
  - She already exists as `naomi-fraser@cast.zamaro.test`, the reviewer of ZAM-0061. The seeder matches either
    address and moves her to the real one.
- **Riverside Community Church:** 2150 Lakeshore Road, Burlington ON L7R 1A3, 905-555-0123 (encrypted),
  Non-denominational, about 350 people.
- **Naomi's saved artists:** Abigail (saved Wed 7 Oct), Hosanna Collective (Sun 27 Sep) and Luz Viva (Sat 12 Sep).
- **Abigail Mensah:** artist, signs in with `abigail@abigailmensah.ca`, contact phone 905-555-0148 (encrypted).
- **Tomi Oduya:** booker for Harvest Point Church, Milton. He has accepted Terms 2026-03 only.
- **Legal documents:**
  - Terms 2026-03.
  - Terms 2026-10, from Thu 8 Oct 2026, with the three changes listed in the accept-terms mock.
  - Privacy policy 2026-10.
- **Roles:** every church person in the cast is a Booker, and every artist user is an Artist.
- **Test sign-in:** `ZAMARO_CAST_PASSWORD` (D28) for the named cast; `cast:booker` creates fresh bookers (D19).

## Known risks

- **Sanctum behind the SSR proxy.** Sanctum treats requests as stateful by their `Origin` or `Referer`. The dev
  server, the SSR server and `api-e2e` must look same-origin and be listed in `ZAMARO_WEB_ORIGINS`. Prove this in
  S1 before building on it.
- **`Secure` cookies.** Chromium accepts `Secure` cookies on `localhost`, but on `127.0.0.1` the session is dropped
  without an error. Pin the e2e base URL to `localhost`.
- **Personal data in SSR.** A private response in the transfer cache leaks between users. S2's filter and client
  rendering must land before any personal endpoint; the "Naomi Fraser" check in server HTML guards this.
- **Shared Redis and Mailpit.** Sessions, throttles and lockouts from `api` and `api-e2e` collide unless their
  keys are prefixed. Lockout specs need a unique email per worker, and Mailpit lookups must filter by recipient.
- **Frozen clock.** e2e can't age tokens or sessions, so backend tests prove expiry and lockout end with time
  travel. e2e uses unknown tokens and cleared cookies instead.
- **Perf flags.** S2 and S15 change `zm-top-bar`, `zm-ticket` and `zm-headliner`, which sit in the hottest
  composite, `Lineup`. Measure before pushing. Only a maintainer may accept an intended cost.
- **Scope creep.** The `/account` mock carries M7 and M9 sections. Hold D23 and keep the masks narrow.
- **Hashing cost.** Argon2id slows tests and seeding, so keep the `testing` environment cheap (D1).
- **Cross-user fixtures.** From S4 on, every authenticated route ships with its fixture in the same commit.
- **Audit seam.** If D22 is declined, 8 `RecordAuditEntry` call sites need a no-op seam until M3.

## Verification at the end of M2

1. `docker compose --profile e2e up -d --wait`, then `docker compose exec api php artisan test`. Every Feature
   test is green, including the contract assertions and `CrossUserAccessTest`.
2. `php artisan scramble:export --fail-on-unknown` and `php artisan i18n:check` pass.
3. Running `php artisan db:seed` twice leaves row counts unchanged.
4. In `frontend`: `npm run lint`, `npm run format:check`, `npx ng build zamaro`, and
   `NG_BUILD_MANGLE=0 npx ng build perf-test`.
5. `npx playwright test` passes in Chromium: specs, `visual/` (now with signed-in states), `a11y/` in both
   themes, and `perf/`.
6. `npm run perf-test -- --baseline <main dist> --fail-on-regression` flags no rows. This milestone's new
   scenarios are AuthCard, ErrorSummary, Avatar, TopBarSignedIn, Toast, ToastRegion, Checkbox, Banner,
   FormSection, SaveBar, SettingsNav, DeviceList, RecoveryCodes, SaveToggle and SavedLineup.
7. Manual walkthrough, with `npm start`, the compose `api` and Mailpit on :8025:
   1. Register a booker and open the link from Mailpit: the "Email verified" banner shows.
   2. Sign out. Sign in as Naomi from Abigail's profile and return to it.
   3. Save and unsave Elijah, and use Undo. Check `/saved` for Sat 14 Nov.
   4. Try an Ottawa church address and see it rejected. Save Riverside, and Discover pre-fills Burlington.
   5. Change the password, and watch a second browser's session end.
   6. Turn on two-step sign-in, sign in with a code, then turn it off.
   7. Sign in as Tomi and accept the new terms.
   8. Choose dark, then reload a second browser signed in as Naomi.
   9. Stop Mailpit, send an email, and find the failed job in Horizon after 6 attempts.
   10. Check each signed-in page at 320 px.
