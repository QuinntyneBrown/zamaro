# Zamaro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: design phase](https://img.shields.io/badge/status-design%20phase-lightgrey.svg)](#project-status)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

**Zamaro is a booking platform that connects churches with Christian praise and
worship artists in Toronto and the surrounding area.**

Churches search for artists who are free on their event date and willing to drive
to them. They compare profiles with bios, photos, videos and the songs each artist
leads, then send a booking request. Artists manage their profile, availability and
requests in one workspace, and the Zamaro team vets every artist before they are
published.

- [Project status](#project-status)
- [Features](#features)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [How we build](#how-we-build)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security](#security)
- [Support](#support)
- [License](#license)

## Project status

Zamaro is in the **design phase**. The requirements, detailed designs, HTML mocks
and design system are written. No application code has been written yet.
Implementation starts from these artifacts, one thin vertical slice at a time.

| Artifact | Location | Status |
|---|---|---|
| High-level requirements (L1) | [`docs/specs/L1.md`](docs/specs/L1.md) | Draft complete |
| Detailed requirements with acceptance criteria (L2) | [`docs/specs/L2.md`](docs/specs/L2.md) | Draft complete |
| Detailed designs (C4, class and sequence diagrams) | [`docs/detailed-designs/`](docs/detailed-designs/README.md) | Draft complete |
| HTML mocks for every page, dialog and state | [`docs/mocks/`](docs/mocks/README.md) | Draft complete |
| Design system (tokens, components, patterns) | [`docs/design-system/`](docs/design-system/README.md) | Draft complete |
| Laravel API, worker and scheduler | `backend/` (planned) | Not started |
| Angular web app | [`frontend/`](frontend/README.md) | Scaffolded: empty workspace with lint, format and pre-commit hook |
| Playwright end-to-end suite | `e2e/` (planned) | Not started |

APIs, folder names and behaviour can change without notice until the first release.

## Features

The planned scope is set out in [`docs/specs/L1.md`](docs/specs/L1.md). In summary:

**For churches (bookers)**

- Find artists who are free on a date and will travel to the event's location,
  then sort and filter the results.
- View artist profiles with bio, photos, videos, setlist, price, availability and
  reviews.
- Save artists to a shortlist, send booking requests and message the artist about
  a booking.
- Pay a 25% deposit when a booking is confirmed and the balance after the event.
- Cancel for free until 14 days before the event.

**For artists**

- Apply to join, then pass vetting by the Zamaro team.
- Manage profile content, media, setlist, price and travel radius.
- Keep an availability calendar that stays consistent with confirmed bookings.
- Accept or decline requests and track earnings, net of the 8% platform fee.

**For the Zamaro team**

- Vet artists, moderate content, resolve booking and payment problems, and audit
  what happened.

**Across the platform**

- Light and dark themes that both conform to WCAG 2.2 Level AA.
- Responsive layouts from small phones to large desktops.
- Dates, times, distances and money formatted for Ontario.
- Handling of personal information in line with Canadian privacy and anti-spam law,
  with data hosted in Canada.

## Architecture

| Container | Technology | Responsibility |
|---|---|---|
| Zamaro Web | Angular with server-side rendering | The booker, artist and admin user interface |
| Zamaro API | PHP 8.3, Laravel 11 | REST API; owns booking rules, persistence and authentication |
| Zamaro Worker | Laravel queue worker and scheduler | Email, payment events, deadlines and other background jobs |
| Database | PostgreSQL 16 | System of record |
| Cache | Redis | Sessions, cached distances and profiles, rate limits |
| Object storage | Object storage behind a CDN | Artist photos and videos |

All containers are hosted in Canadian regions. Each feature's design in
[`docs/detailed-designs/`](docs/detailed-designs/README.md) has C4 context,
container and component diagrams for its slice of this system.

## Repository layout

```text
.
├── docs/
│   ├── specs/              # L1 high-level and L2 detailed requirements
│   ├── detailed-designs/   # One design per vertical feature, with PlantUML diagrams
│   ├── mocks/              # Static HTML design reference, light and dark
│   └── design-system/      # Tokens, foundations, components and patterns
├── .claude/skills/         # Agent skills used to build this repository
├── .agents/skills/         # The same skills for other coding agents
├── AGENTS.md               # Conventions for humans and coding agents
├── CONTRIBUTING.md         # How to propose and make changes
└── README.md
```

## Getting started

### Prerequisites

- [Git](https://git-scm.com/)
- A modern browser
- Optional: Python 3 or Node.js, to serve the docs over HTTP

The application toolchain (PHP, Composer, Node.js, the Angular CLI and Playwright)
will be documented here when the first slice of code lands.

### Browse the design artifacts

The mocks and the design system are plain HTML and CSS with no build step.

```sh
git clone https://github.com/QuinntyneBrown/zamaro.git
cd zamaro

# Serve the repository root, then open the links below.
python3 -m http.server 8000
# or: npx http-server -p 8000
```

| Open | To see |
|---|---|
| <http://localhost:8000/docs/mocks/> | Every page, dialog and notification in every state |
| <http://localhost:8000/docs/design-system/> | Tokens, foundations, components and patterns |

You can also open the `index.html` files directly from disk. In the design system,
press <kbd>t</kbd> to switch between the light and dark themes.

## How we build

Every change to production behaviour follows the same path:

1. **Requirement.** Add or update L1 and L2 requirements in [`docs/specs/`](docs/specs/).
2. **Detailed design.** Add or update the feature's design in
   [`docs/detailed-designs/`](docs/detailed-designs/README.md).
3. **Mock.** Add or update every affected page and state in [`docs/mocks/`](docs/mocks/README.md).
4. **Acceptance tests first.** Write Given-When-Then criteria and a failing acceptance
   test: an API integration test for the backend, or a Playwright test using the Page
   Object Model for the frontend.
5. **Implement in thin slices.** Write only the code that makes that slice's test pass,
   refactor with the tests green, then move to the next slice.

[`AGENTS.md`](AGENTS.md) holds the backend, frontend and end-to-end conventions.
[`CONTRIBUTING.md`](CONTRIBUTING.md) explains how to propose and submit a change.

## Contributing

Contributions are welcome. Read the [contributing guide](CONTRIBUTING.md) before you
open an issue or a pull request. It covers the development workflow, commit message
format and review process.

Good places to start:

- Review the [L2 requirements](docs/specs/L2.md) and point out gaps or ambiguities.
- Check the [mocks](docs/mocks/README.md) against the requirements and the
  [design system](docs/design-system/README.md).
- Pick up an issue labelled `good first issue`.

## Code of conduct

This project has adopted the [Contributor Covenant](CODE_OF_CONDUCT.md). By taking part
you agree to uphold it.

## Security

Do not report security vulnerabilities through public GitHub issues. Follow the
process in [SECURITY.md](SECURITY.md).

## Support

See [SUPPORT.md](SUPPORT.md) for how to ask questions and get help.

## License

Copyright (c) 2026 Quinntyne Brown.

Licensed under the [MIT License](LICENSE).
