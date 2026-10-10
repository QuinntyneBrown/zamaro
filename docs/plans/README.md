# Plans

One plan per milestone, in dependency order. Each plan breaks its milestone into thin ATDD slices, following
AGENTS.md: Given-When-Then criteria, then a failing acceptance test, then the implementation, then a regression
run, then a commit. Each slice lists:
- the L2 requirements it covers;
- the behaviour, using the mock cast;
- the tests to write first;
- what to build;
- any ADR needed (named by topic; the number is taken from `docs/adr/` when it is written);
- new components and their perf scenarios;
- the route states to add.

Every plan also lists the decisions still open, each with a recommended default; those marked as needing the
user's OK wait for them. When a milestone starts, re-read its plan against the code as built and record
changes in the plan as you go, the way M1's "Changes made while implementing" section does.

| Milestone | Plan | Status |
|---|---|---|
| M1 | [Foundations and public browse](m1-foundations-and-browse.md) | In progress: S0–S11 done, S12 next |
| M2 | [Accounts and sessions](m2-accounts-and-sessions.md) | Not started |
| M3 | [Artist onboarding and admin app](m3-artist-onboarding-and-admin.md) | Not started |
| M4 | [Artist workspace and availability](m4-artist-workspace-and-availability.md) | Not started |
| M5 | [Booking requests](m5-booking-requests.md) | Not started |
| M6 | [Payments and cancellations](m6-payments-and-cancellations.md) | Not started |
| M7 | [Reviews and notifications](m7-reviews-and-notifications.md) | Not started |
| M8 | [Admin support](m8-admin-support.md) | Not started |
| M9 | [Hardening](m9-hardening.md) | Not started |
| M10 | [Production readiness](m10-production-readiness.md) | Not started |

The roadmap and the reasons behind this order are in the M1 plan.
