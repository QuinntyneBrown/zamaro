# Contributing to Zamaro

Thank you for your interest in Zamaro. This guide explains how to report problems,
propose changes and get a pull request merged.

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Reporting bugs](#reporting-bugs)
- [Proposing features and behaviour changes](#proposing-features-and-behaviour-changes)
- [Development workflow](#development-workflow)
- [Coding conventions](#coding-conventions)
- [Testing](#testing)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Working with coding agents](#working-with-coding-agents)
- [License](#license)

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By taking part you
agree to uphold it.

## Ways to contribute

- Report a bug or a gap in the requirements.
- Improve the requirements, detailed designs, mocks or design system.
- Implement a slice of a feature that already has a requirement, design and mock.
- Review open pull requests.
- Improve the documentation.

If you plan a large change, open an issue first so we can agree on the approach
before you invest time in it.

## Reporting bugs

1. Search [existing issues](https://github.com/QuinntyneBrown/zamaro/issues) to avoid
   duplicates.
2. Open a new issue with the **Bug report** template.
3. Include the steps to reproduce, what you expected, what happened, and the L2
   requirement the behaviour breaks if you know it.

Do **not** report security vulnerabilities in public issues. Follow
[SECURITY.md](SECURITY.md) instead.

## Proposing features and behaviour changes

Zamaro is specification-driven. Every new feature, and every change to how an
existing feature behaves, needs three artifacts before any production code is
written:

| Artifact | Location | Skill |
|---|---|---|
| Requirement (L1 and L2 with acceptance criteria) | [`docs/specs/`](docs/specs/) | `engineering-requirements` |
| Detailed design | [`docs/detailed-designs/`](docs/detailed-designs/README.md) | `writing-software-design-documents` |
| Mock for every affected page and state, light and dark | [`docs/mocks/`](docs/mocks/README.md) | `writing-html-mocks` |

Open an issue with the **Feature request** template to discuss the change. Once it is
agreed, the requirement, design and mock can land in one pull request or in several.

Changes that only touch documentation, the design system, mocks or tests do not need
this process unless they are part of a production behaviour change.

## Development workflow

1. **Fork** the repository and create a branch from `main`:

   ```sh
   git checkout -b feat/short-description
   ```

2. **Plan thin slices.** Follow the `implementing-incrementally` skill in
   [`.claude/skills/`](.claude/skills/) or [`.agents/skills/`](.agents/skills/). Each
   slice should be small enough to review on its own and leave the system working.
3. **For each slice, test first (ATDD):**
   1. Write the Given-When-Then acceptance criteria.
   2. Write the acceptance test.
   3. Run it and confirm it fails for the expected reason.
   4. Write only the production code that makes it pass.
   5. Refactor with the tests green.
   6. Run the relevant regression checks.
4. **Keep artifacts aligned.** If the implementation shows that the requirement, design
   or mock is wrong, update them in the same pull request.
5. **Open a pull request** against `main`.

Do not write the whole feature and add tests afterwards, and never weaken a test to
make it pass.

## Coding conventions

[`AGENTS.md`](AGENTS.md) is the source of truth for conventions. The most important ones:

### Backend (PHP / Laravel)

- Business rules live in domain services, actions and jobs, not in controllers.
- Endpoints require authentication by default. Keep intentional anonymous access and
  middleware ordering when you change API auth.
- User-owned data stays scoped to the current user.
- The API never runs database migrations on startup. Run them explicitly.
- Seed data is idempotent and safe to run more than once.

### Frontend (Angular)

- Prettier owns formatting and angular-eslint owns lint. CI fails on either, so run
  `npm run lint` and `npm run format:check` in the frontend workspace.
- Component selectors use the `zm-` prefix. Class, file and folder names do not.
- Keep the BEM classes and accessible state attributes from the mocks.
- Read design tokens by role (`var(--color-fg-default)`, `--space-*`), never by value.
- Use the Angular CDK Dialog and Overlay for modal behaviour. Pages never contain
  inline edit forms.
- Pages depend on API service contracts through injection tokens, not on concrete
  implementations.

### Documentation

- Write in plain, direct English with short sentences.
- Use Canadian conventions for dates, times, distances and money in examples.
- Keep requirement IDs (`L1-###`, `L2-###`) stable. Do not renumber existing ones.

## Testing

| Layer | Tool | Style |
|---|---|---|
| Backend | Laravel / PHPUnit | Integration tests against the API |
| Frontend and end to end | Playwright, Chromium only | Page Object Model: one page object per screen owns the selectors and interactions |

- Tests describe behaviour. Never put a selector in a test; keep it in the page object.
- Update visual baselines only for intentional design changes, and say so in the pull
  request.
- Do not write architecture tests, such as tests of folder structure, naming, banned
  APIs or spec parsing. The compiler, linters and code review enforce those.
- Do not write tests for the mocks or the design system.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>(<scope>): <summary>

<body>

<footer>
```

- **type:** `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci` or `chore`
- **scope:** the area changed, such as `specs`, `detailed-designs`, `mocks`,
  `design-system`, `api`, `web` or `e2e`
- **summary:** imperative mood, lower case, no full stop, at most 72 characters

Examples:

```text
feat(api): reject booking requests outside the artist's travel radius
docs(specs): clarify the deposit deadline in L2-037
fix(mocks): align the booking stub with the LG breakpoint
```

## Pull requests

Before you open a pull request:

- [ ] The change is linked to an issue, or the description explains why it is needed.
- [ ] Production behaviour changes have a requirement, a detailed design and a mock.
- [ ] Acceptance tests were written first and are passing.
- [ ] Lint, formatting and the relevant tests pass locally.
- [ ] Documentation is updated, including [`CHANGELOG.md`](CHANGELOG.md) for
      user-facing changes.

Then:

1. Fill in the pull request template.
2. Keep the pull request focused on one change. Split unrelated work.
3. A maintainer reviews it. Respond to comments by pushing new commits rather than
   force-pushing, so reviewers can see what changed.
4. Once it is approved and CI is green, a maintainer merges it.

## Working with coding agents

This repository is set up for coding agents as well as people. [`AGENTS.md`](AGENTS.md)
is the single source of guidance. `CLAUDE.md`, `GEMINI.md` and
`.github/copilot-instructions.md` all point to it. The skills in `.claude/skills/` and
`.agents/skills/` describe how requirements, designs, mocks, the design system and
incremental implementation are produced.

If an agent writes your contribution, you are still responsible for reviewing it and
making sure it follows this guide.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE) that covers this project.
