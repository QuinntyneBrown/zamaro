# Security policy

Zamaro will handle accounts, payments and personal information about churches and
artists. We take the security of that information seriously and appreciate reports
that help us protect it.

## Supported versions

Zamaro has not been released yet. Security fixes are made on the `main` branch.

| Version | Supported |
|---|---|
| `main` | Yes |

This table will list supported release lines once versioned releases begin.

## Reporting a vulnerability

**Do not report security vulnerabilities through public GitHub issues, discussions or
pull requests.**

Report them privately through GitHub's
[private vulnerability reporting](https://github.com/QuinntyneBrown/zamaro/security/advisories/new).

Include as much of the following as you can:

- The type of issue, such as broken access control, injection or cross-site scripting
- The affected files, endpoints, pages or requirements, with links to the source
- The commit, branch or tag affected
- Any special configuration needed to reproduce the issue
- Step-by-step instructions to reproduce it
- Proof-of-concept or exploit code, if you have it
- The impact, including how an attacker could exploit it

## What to expect

- We acknowledge your report within **3 business days**.
- We send an initial assessment within **10 business days**.
- We keep you updated while we work on a fix and tell you when it is released.
- We credit you in the security advisory unless you ask us not to.

## Coordinated disclosure

Please give us a reasonable amount of time to fix the issue before you disclose it
publicly. We aim to release a fix within 90 days of the report. We will agree a
disclosure date with you.

## Scope

In scope:

- Code, configuration and infrastructure definitions in this repository
- Weaknesses in the requirements or designs in `docs/` that would lead to an insecure
  implementation, such as missing authorisation rules

Out of scope:

- Vulnerabilities in third-party services and dependencies. Report those to their
  maintainers. Tell us too if Zamaro is affected.
- Denial-of-service testing, social engineering and physical attacks
- Reports from automated scanners without a demonstrated impact

## Safe harbour

We will not take legal action against people who research and report vulnerabilities
in good faith under this policy. Good faith means you avoid privacy violations, data
destruction and service disruption, you only access the data needed to demonstrate the
issue, and you do not disclose it before we have had a chance to fix it.

## Security design

The security requirements are the L2 requirements in
[`docs/specs/L2.md`](docs/specs/L2.md) that trace to L1-016. The designs that meet them
are in [`docs/detailed-designs/security/`](docs/detailed-designs/security/).
