# Zamaro detailed designs

This tree refines the requirements in [`docs/specs`](../specs/) into one detailed design per vertical feature. Each feature folder holds a `README.md` with four sections (Overview, Description, Requirements, Diagrams) and a `diagrams/` folder of PlantUML sources with their rendered PNG images.

Zamaro is built as an Angular web application with server-side rendering (Zamaro Web), a Laravel REST API (Zamaro API), a Laravel queue worker and scheduler (Zamaro Worker), PostgreSQL, Redis and object storage hosted in Canadian regions. Every feature design uses these container names and the shared domain vocabulary (`Booking`, `BookingStatus`, `Artist`, `AvailabilityService`, `PaymentGateway` and others).

Details that the specs leave open are marked `<TO SUPPLY>` inside each design.

## Subsystems and features

### discovery

Search for artists free on a date and within driving distance, then sort, filter and recover from an empty lineup (L1-001, L1-002).

| Feature | L2 requirements |
|---------|-----------------|
| [Search available artists](discovery/search-available-artists/) | L2-002, L2-003, L2-004, L2-005, L2-006, L2-010, L2-097, L2-106 |
| [Sort and filter results](discovery/sort-and-filter-results/) | L2-007, L2-008, L2-009 |
| [Suggest alternatives when sold out](discovery/suggest-alternatives-when-sold-out/) | L2-011 |

### artist-profiles

Public artist pages, the booking stub, missing-artist handling, search indexing and sharing (L1-003, L1-025).

| Feature | L2 requirements |
|---------|-----------------|
| [Index and share a profile](artist-profiles/index-and-share-profile/) | L2-112, L2-113, L2-089 |
| [Pick a date and start booking](artist-profiles/pick-a-date-and-start-booking/) | L2-017, L2-019, L2-044 |
| [Resolve a missing artist](artist-profiles/resolve-missing-artist/) | L2-021 |
| [View an artist profile](artist-profiles/view-artist-profile/) | L2-012, L2-013, L2-014, L2-015, L2-016, L2-020, L2-083, L2-098, L2-107 |

### accounts

Booker registration, sign-in, church details, account settings and the saved-artists shortlist (L1-004, L1-005).

| Feature | L2 requirements |
|---------|-----------------|
| [Manage account settings](accounts/manage-account-settings/) | L2-025 |
| [Manage the church profile](accounts/manage-church-profile/) | L2-024, L2-001 |
| [Register as a booker](accounts/register-booker/) | L2-022, L2-080 |
| [Save an artist](accounts/save-artist/) | L2-026 |
| [Sign in and recover access](accounts/sign-in-and-recover-access/) | L2-023, L2-072 |
| [View saved artists](accounts/view-saved-artists/) | L2-027 |

### bookings

Booking requests, responses, the status lifecycle, cancellation and booking messages (L1-006, L1-008, L1-009).

| Feature | L2 requirements |
|---------|-----------------|
| [Cancel a booking](bookings/cancel-booking/) | L2-042, L2-043, L2-044 |
| [Exchange booking messages](bookings/exchange-booking-messages/) | L2-045, L2-046 |
| [Respond to a booking request](bookings/respond-to-booking-request/) | L2-030, L2-034 |
| [Run the booking lifecycle](bookings/run-booking-lifecycle/) | L2-029, L2-092 |
| [Send a booking request](bookings/send-booking-request/) | L2-022, L2-028, L2-108 |
| [View the booker's bookings](bookings/view-booker-bookings/) | L2-033 |
| [Withdraw a booking request](bookings/withdraw-booking-request/) | L2-031 |

### payments

Deposits, balance collection, artist payouts, receipts and reconciliation with the payment processor (L1-007).

| Feature | L2 requirements |
|---------|-----------------|
| [Collect the balance](payments/collect-balance/) | L2-038 |
| [Issue receipts](payments/issue-receipts/) | L2-040 |
| [Pay the deposit](payments/pay-deposit/) | L2-035, L2-036, L2-037, L2-032 |
| [Pay out artists](payments/pay-out-artists/) | L2-039 |
| [Reconcile payment events](payments/reconcile-payment-events/) | L2-041 |

### artist-onboarding

Artist applications, vetting and Vulnerable Sector Checks (L1-010).

| Feature | L2 requirements |
|---------|-----------------|
| [Apply as an artist](artist-onboarding/apply-as-artist/) | L2-047, L2-001 |
| [Review an artist application](artist-onboarding/review-artist-application/) | L2-048, L2-067 |
| [Verify a Vulnerable Sector Check](artist-onboarding/verify-vulnerable-sector-check/) | L2-049 |

### artist-workspace

The artist's dashboard and own profile content, media, setlist and profile address (L1-011).

| Feature | L2 requirements |
|---------|-----------------|
| [Change profile address](artist-workspace/change-profile-address/) | L2-055 |
| [Edit profile details](artist-workspace/edit-profile-details/) | L2-050, L2-054 |
| [Manage setlist](artist-workspace/manage-setlist/) | L2-053 |
| [Upload photos](artist-workspace/upload-photos/) | L2-051, L2-076 |
| [Upload videos](artist-workspace/upload-videos/) | L2-052, L2-076 |
| [View the artist dashboard](artist-workspace/view-artist-dashboard/) | L2-034, L2-039, L2-056, L2-074, L2-096, L2-105 |

### artist-availability

The artist's availability calendar and calendar feed (L1-012).

| Feature | L2 requirements |
|---------|-----------------|
| [Manage the availability calendar](artist-availability/manage-availability-calendar/) | L2-056, L2-057 |
| [Publish a calendar feed](artist-availability/publish-calendar-feed/) | L2-058 |

### reviews

Church reviews, ratings, artist replies and moderation (L1-013).

| Feature | L2 requirements |
|---------|-----------------|
| [Leave a review](reviews/leave-review/) | L2-059 |
| [Reply to a review](reviews/reply-to-review/) | L2-061 |
| [Report and moderate a review](reviews/report-and-moderate-review/) | L2-062 |
| [Show reviews and rating](reviews/show-reviews-and-rating/) | L2-018, L2-060 |

### notifications

Transactional email, event reminders and email preferences (L1-014).

| Feature | L2 requirements |
|---------|-----------------|
| [Manage email preferences](notifications/manage-email-preferences/) | L2-065 |
| [Send event reminders](notifications/send-event-reminders/) | L2-064 |
| [Send transactional emails](notifications/send-transactional-emails/) | L2-063, L2-065 |

### administration

Administrator access, artist suspension, booking and payment support, and the audit log (L1-015).

| Feature | L2 requirements |
|---------|-----------------|
| [Record the audit log](administration/record-audit-log/) | L2-069 |
| [Secure administrator access](administration/secure-admin-access/) | L2-066 |
| [Support bookings and payments](administration/support-bookings-and-payments/) | L2-068 |
| [Suspend and reinstate artists](administration/suspend-and-reinstate-artists/) | L2-067 |

### security

Transport, headers, sessions, authorisation, uploads, rate limits, secrets and data protection (L1-016).

| Feature | L2 requirements |
|---------|-----------------|
| [Authorise and validate requests](security/authorise-and-validate-requests/) | L2-074, L2-075 |
| [Enforce transport security and headers](security/enforce-transport-and-headers/) | L2-070, L2-071 |
| [Limit request rates](security/limit-request-rates/) | L2-077 |
| [Manage sessions and CSRF](security/manage-sessions-and-csrf/) | L2-073 |
| [Protect secrets and data](security/protect-secrets-and-data/) | L2-078, L2-079 |
| [Scan and serve uploads](security/scan-and-serve-uploads/) | L2-076 |

### privacy

Consent, data export, account deletion and minimal public exposure (L1-017).

| Feature | L2 requirements |
|---------|-----------------|
| [Delete an account](privacy/delete-account/) | L2-082 |
| [Export personal data](privacy/export-personal-data/) | L2-081 |
| [Minimise public exposure](privacy/minimise-public-exposure/) | L2-083 |
| [Record consent](privacy/record-consent/) | L2-080 |

### operations

Response times, page speed, health, background jobs, backups, deployment, hosting and API conventions (L1-018, L1-019, L1-017).

| Feature | L2 requirements |
|---------|-----------------|
| [Apply API conventions](operations/apply-api-conventions/) | L2-095 |
| [Back up, deploy and host](operations/back-up-deploy-and-host/) | L2-084, L2-091, L2-094 |
| [Deliver fast pages](operations/deliver-fast-pages/) | L2-086, L2-087, L2-088 |
| [Meet response-time budgets](operations/meet-response-time-budgets/) | L2-085, L2-089 |
| [Monitor health and errors](operations/monitor-health-and-errors/) | L2-090, L2-093 |
| [Run background jobs](operations/run-background-jobs/) | L2-092 |

### user-experience

Responsive layout, accessibility, themes, loading and feedback states, and localisation (L1-020 to L1-024).

| Feature | L2 requirements |
|---------|-----------------|
| [Adapt layout to screens](user-experience/adapt-layout-to-screens/) | L2-096, L2-099 |
| [Localise formats and text](user-experience/localise-formats-and-text/) | L2-110, L2-111 |
| [Meet accessibility standards](user-experience/meet-accessibility-standards/) | L2-100, L2-101, L2-102, L2-103 |
| [Show loading and feedback](user-experience/show-loading-and-feedback/) | L2-105, L2-108, L2-109, L2-114 |
| [Switch theme](user-experience/switch-theme/) | L2-104 |

## Traceability

Each L2 requirement and the feature designs that realise it.

| L2 ID | Refines (L1) | Title | Feature designs |
|-------|--------------|-------|-----------------|
| `L2-001` | `L1-001` | Service area boundary | [accounts/manage-church-profile](accounts/manage-church-profile/), [artist-onboarding/apply-as-artist](artist-onboarding/apply-as-artist/) |
| `L2-002` | `L1-001` | Distance calculation | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-003` | `L1-001` | Travel match rule | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-004` | `L1-002` | Search inputs | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-005` | `L1-002` | Availability match | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-006` | `L1-002` | Result card content | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-007` | `L1-002` | Sorting results | [discovery/sort-and-filter-results](discovery/sort-and-filter-results/) |
| `L2-008` | `L1-002` | Filtering results | [discovery/sort-and-filter-results](discovery/sort-and-filter-results/) |
| `L2-009` | `L1-002` | Search state in the URL | [discovery/sort-and-filter-results](discovery/sort-and-filter-results/) |
| `L2-010` | `L1-002` | Result paging | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-011` | `L1-002` | No results | [discovery/suggest-alternatives-when-sold-out](discovery/suggest-alternatives-when-sold-out/) |
| `L2-012` | `L1-003` | Public profile route and header | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-013` | `L1-003` | About section | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-014` | `L1-003` | Videos section | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-015` | `L1-003` | Photo gallery | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-016` | `L1-003` | Setlist | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-017` | `L1-003` | Upcoming dates | [artist-profiles/pick-a-date-and-start-booking](artist-profiles/pick-a-date-and-start-booking/) |
| `L2-018` | `L1-003` | Reviews on the profile | [reviews/show-reviews-and-rating](reviews/show-reviews-and-rating/) |
| `L2-019` | `L1-003` | Booking stub | [artist-profiles/pick-a-date-and-start-booking](artist-profiles/pick-a-date-and-start-booking/) |
| `L2-020` | `L1-003` | Profile sections with no content | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-021` | `L1-003` | Missing or removed artist | [artist-profiles/resolve-missing-artist](artist-profiles/resolve-missing-artist/) |
| `L2-022` | `L1-004` | Booker registration | [accounts/register-booker](accounts/register-booker/), [bookings/send-booking-request](bookings/send-booking-request/) |
| `L2-023` | `L1-004` | Sign-in, sign-out and password reset | [accounts/sign-in-and-recover-access](accounts/sign-in-and-recover-access/) |
| `L2-024` | `L1-004` | Church profile | [accounts/manage-church-profile](accounts/manage-church-profile/) |
| `L2-025` | `L1-004` | Account settings | [accounts/manage-account-settings](accounts/manage-account-settings/) |
| `L2-026` | `L1-005` | Save and unsave an artist | [accounts/save-artist](accounts/save-artist/) |
| `L2-027` | `L1-005` | Saved artists list | [accounts/view-saved-artists](accounts/view-saved-artists/) |
| `L2-028` | `L1-006` | Send a booking request | [bookings/send-booking-request](bookings/send-booking-request/) |
| `L2-029` | `L1-006` | Booking status lifecycle | [bookings/run-booking-lifecycle](bookings/run-booking-lifecycle/) |
| `L2-030` | `L1-006` | Artist accepts or declines | [bookings/respond-to-booking-request](bookings/respond-to-booking-request/) |
| `L2-031` | `L1-006` | Booker withdraws a request | [bookings/withdraw-booking-request](bookings/withdraw-booking-request/) |
| `L2-032` | `L1-006` | No double booking | [payments/pay-deposit](payments/pay-deposit/) |
| `L2-033` | `L1-006` | Booker bookings page | [bookings/view-booker-bookings](bookings/view-booker-bookings/) |
| `L2-034` | `L1-006` | Artist requests inbox | [bookings/respond-to-booking-request](bookings/respond-to-booking-request/), [artist-workspace/view-artist-dashboard](artist-workspace/view-artist-dashboard/) |
| `L2-035` | `L1-007` | Payment processor and card data | [payments/pay-deposit](payments/pay-deposit/) |
| `L2-036` | `L1-007` | Prices and tax | [payments/pay-deposit](payments/pay-deposit/) |
| `L2-037` | `L1-007` | Deposit | [payments/pay-deposit](payments/pay-deposit/) |
| `L2-038` | `L1-007` | Balance collection | [payments/collect-balance](payments/collect-balance/) |
| `L2-039` | `L1-007` | Artist payouts | [payments/pay-out-artists](payments/pay-out-artists/), [artist-workspace/view-artist-dashboard](artist-workspace/view-artist-dashboard/) |
| `L2-040` | `L1-007` | Receipts | [payments/issue-receipts](payments/issue-receipts/) |
| `L2-041` | `L1-007` | Payment events and reconciliation | [payments/reconcile-payment-events](payments/reconcile-payment-events/) |
| `L2-042` | `L1-008` | Booker cancels a Confirmed booking | [bookings/cancel-booking](bookings/cancel-booking/) |
| `L2-043` | `L1-008` | Artist cancels a Confirmed booking | [bookings/cancel-booking](bookings/cancel-booking/) |
| `L2-044` | `L1-008` | Cancellation policy visibility | [artist-profiles/pick-a-date-and-start-booking](artist-profiles/pick-a-date-and-start-booking/), [bookings/cancel-booking](bookings/cancel-booking/) |
| `L2-045` | `L1-009` | Booking messages | [bookings/exchange-booking-messages](bookings/exchange-booking-messages/) |
| `L2-046` | `L1-009` | Contact details before confirmation | [bookings/exchange-booking-messages](bookings/exchange-booking-messages/) |
| `L2-047` | `L1-010` | Artist application | [artist-onboarding/apply-as-artist](artist-onboarding/apply-as-artist/) |
| `L2-048` | `L1-010` | Application review | [artist-onboarding/review-artist-application](artist-onboarding/review-artist-application/) |
| `L2-049` | `L1-010` | Vulnerable Sector Check | [artist-onboarding/verify-vulnerable-sector-check](artist-onboarding/verify-vulnerable-sector-check/) |
| `L2-050` | `L1-011` | Edit profile details | [artist-workspace/edit-profile-details](artist-workspace/edit-profile-details/) |
| `L2-051` | `L1-011` | Photo uploads | [artist-workspace/upload-photos](artist-workspace/upload-photos/) |
| `L2-052` | `L1-011` | Video uploads | [artist-workspace/upload-videos](artist-workspace/upload-videos/) |
| `L2-053` | `L1-011` | Setlist management | [artist-workspace/manage-setlist](artist-workspace/manage-setlist/) |
| `L2-054` | `L1-011` | Profile preview | [artist-workspace/edit-profile-details](artist-workspace/edit-profile-details/) |
| `L2-055` | `L1-011` | Profile address (slug) | [artist-workspace/change-profile-address](artist-workspace/change-profile-address/) |
| `L2-056` | `L1-012` | Availability calendar | [artist-availability/manage-availability-calendar](artist-availability/manage-availability-calendar/), [artist-workspace/view-artist-dashboard](artist-workspace/view-artist-dashboard/) |
| `L2-057` | `L1-012` | Availability and bookings stay consistent | [artist-availability/manage-availability-calendar](artist-availability/manage-availability-calendar/) |
| `L2-058` | `L1-012` | Calendar feed | [artist-availability/publish-calendar-feed](artist-availability/publish-calendar-feed/) |
| `L2-059` | `L1-013` | Who can review | [reviews/leave-review](reviews/leave-review/) |
| `L2-060` | `L1-013` | Rating calculation | [reviews/show-reviews-and-rating](reviews/show-reviews-and-rating/) |
| `L2-061` | `L1-013` | Artist reply to a review | [reviews/reply-to-review](reviews/reply-to-review/) |
| `L2-062` | `L1-013` | Review reporting and moderation | [reviews/report-and-moderate-review](reviews/report-and-moderate-review/) |
| `L2-063` | `L1-014` | Email notifications | [notifications/send-transactional-emails](notifications/send-transactional-emails/) |
| `L2-064` | `L1-014` | Event reminders | [notifications/send-event-reminders](notifications/send-event-reminders/) |
| `L2-065` | `L1-014` | Email delivery and preferences | [notifications/manage-email-preferences](notifications/manage-email-preferences/), [notifications/send-transactional-emails](notifications/send-transactional-emails/) |
| `L2-066` | `L1-015` | Administrator access | [administration/secure-admin-access](administration/secure-admin-access/) |
| `L2-067` | `L1-015` | Artist management | [artist-onboarding/review-artist-application](artist-onboarding/review-artist-application/), [administration/suspend-and-reinstate-artists](administration/suspend-and-reinstate-artists/) |
| `L2-068` | `L1-015` | Booking and payment support | [administration/support-bookings-and-payments](administration/support-bookings-and-payments/) |
| `L2-069` | `L1-015` | Audit log | [administration/record-audit-log](administration/record-audit-log/) |
| `L2-070` | `L1-016` | Transport security | [security/enforce-transport-and-headers](security/enforce-transport-and-headers/) |
| `L2-071` | `L1-016` | Security headers | [security/enforce-transport-and-headers](security/enforce-transport-and-headers/) |
| `L2-072` | `L1-016` | Passwords and multi-factor authentication | [accounts/sign-in-and-recover-access](accounts/sign-in-and-recover-access/) |
| `L2-073` | `L1-016` | Sessions and CSRF | [security/manage-sessions-and-csrf](security/manage-sessions-and-csrf/) |
| `L2-074` | `L1-016` | Authorisation | [security/authorise-and-validate-requests](security/authorise-and-validate-requests/), [artist-workspace/view-artist-dashboard](artist-workspace/view-artist-dashboard/) |
| `L2-075` | `L1-016` | Input validation and output encoding | [security/authorise-and-validate-requests](security/authorise-and-validate-requests/) |
| `L2-076` | `L1-016` | Upload security | [artist-workspace/upload-photos](artist-workspace/upload-photos/), [artist-workspace/upload-videos](artist-workspace/upload-videos/), [security/scan-and-serve-uploads](security/scan-and-serve-uploads/) |
| `L2-077` | `L1-016` | Rate limiting and abuse prevention | [security/limit-request-rates](security/limit-request-rates/) |
| `L2-078` | `L1-016` | Secrets, dependencies and code scanning | [security/protect-secrets-and-data](security/protect-secrets-and-data/) |
| `L2-079` | `L1-016` | Data protection at rest and in logs | [security/protect-secrets-and-data](security/protect-secrets-and-data/) |
| `L2-080` | `L1-017` | Consent | [accounts/register-booker](accounts/register-booker/), [privacy/record-consent](privacy/record-consent/) |
| `L2-081` | `L1-017` | Personal data export | [privacy/export-personal-data](privacy/export-personal-data/) |
| `L2-082` | `L1-017` | Account deletion | [privacy/delete-account](privacy/delete-account/) |
| `L2-083` | `L1-017` | Minimal public exposure | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/), [privacy/minimise-public-exposure](privacy/minimise-public-exposure/) |
| `L2-084` | `L1-017` | Data residency | [operations/back-up-deploy-and-host](operations/back-up-deploy-and-host/) |
| `L2-085` | `L1-018` | API response times | [operations/meet-response-time-budgets](operations/meet-response-time-budgets/) |
| `L2-086` | `L1-018` | Page speed | [operations/deliver-fast-pages](operations/deliver-fast-pages/) |
| `L2-087` | `L1-018` | Frontend bundle budget | [operations/deliver-fast-pages](operations/deliver-fast-pages/) |
| `L2-088` | `L1-018` | Media delivery | [operations/deliver-fast-pages](operations/deliver-fast-pages/) |
| `L2-089` | `L1-018` | Caching | [artist-profiles/index-and-share-profile](artist-profiles/index-and-share-profile/), [operations/meet-response-time-budgets](operations/meet-response-time-budgets/) |
| `L2-090` | `L1-019` | Availability target and health checks | [operations/monitor-health-and-errors](operations/monitor-health-and-errors/) |
| `L2-091` | `L1-019` | Backups and recovery | [operations/back-up-deploy-and-host](operations/back-up-deploy-and-host/) |
| `L2-092` | `L1-019` | Background jobs | [bookings/run-booking-lifecycle](bookings/run-booking-lifecycle/), [operations/run-background-jobs](operations/run-background-jobs/) |
| `L2-093` | `L1-019` | Observability | [operations/monitor-health-and-errors](operations/monitor-health-and-errors/) |
| `L2-094` | `L1-019` | Deployments | [operations/back-up-deploy-and-host](operations/back-up-deploy-and-host/) |
| `L2-095` | `L1-019` | API conventions | [operations/apply-api-conventions](operations/apply-api-conventions/) |
| `L2-096` | `L1-020` | Layout at every breakpoint | [user-experience/adapt-layout-to-screens](user-experience/adapt-layout-to-screens/), [artist-workspace/view-artist-dashboard](artist-workspace/view-artist-dashboard/) |
| `L2-097` | `L1-020` | Discover layout | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-098` | `L1-020` | Artist profile layout | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-099` | `L1-020` | Navigation and dialogs on small screens | [user-experience/adapt-layout-to-screens](user-experience/adapt-layout-to-screens/) |
| `L2-100` | `L1-021` | WCAG 2.2 AA conformance | [user-experience/meet-accessibility-standards](user-experience/meet-accessibility-standards/) |
| `L2-101` | `L1-021` | Keyboard and focus | [user-experience/meet-accessibility-standards](user-experience/meet-accessibility-standards/) |
| `L2-102` | `L1-021` | Assistive technology support | [user-experience/meet-accessibility-standards](user-experience/meet-accessibility-standards/) |
| `L2-103` | `L1-021` | Motion and contrast | [user-experience/meet-accessibility-standards](user-experience/meet-accessibility-standards/) |
| `L2-104` | `L1-022` | Light and dark themes | [user-experience/switch-theme](user-experience/switch-theme/) |
| `L2-105` | `L1-023` | Loading states | [user-experience/show-loading-and-feedback](user-experience/show-loading-and-feedback/), [artist-workspace/view-artist-dashboard](artist-workspace/view-artist-dashboard/) |
| `L2-106` | `L1-023` | Search error | [discovery/search-available-artists](discovery/search-available-artists/) |
| `L2-107` | `L1-023` | Profile error | [artist-profiles/view-artist-profile](artist-profiles/view-artist-profile/) |
| `L2-108` | `L1-023` | Form submission safety | [bookings/send-booking-request](bookings/send-booking-request/), [user-experience/show-loading-and-feedback](user-experience/show-loading-and-feedback/) |
| `L2-109` | `L1-023` | Toasts | [user-experience/show-loading-and-feedback](user-experience/show-loading-and-feedback/) |
| `L2-110` | `L1-024` | Dates, times, money and distance | [user-experience/localise-formats-and-text](user-experience/localise-formats-and-text/) |
| `L2-111` | `L1-024` | Translation-ready text | [user-experience/localise-formats-and-text](user-experience/localise-formats-and-text/) |
| `L2-112` | `L1-025` | Search engine visibility | [artist-profiles/index-and-share-profile](artist-profiles/index-and-share-profile/) |
| `L2-113` | `L1-025` | Sharing a profile | [artist-profiles/index-and-share-profile](artist-profiles/index-and-share-profile/) |
| `L2-114` | `L1-023` | Working offline | [user-experience/show-loading-and-feedback](user-experience/show-loading-and-feedback/) |
