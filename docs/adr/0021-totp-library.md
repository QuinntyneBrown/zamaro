# ADR-0021: TOTP two-step sign-in with google2fa, and the QR code as an image from the API

**Date:** 2026-10-11
**Category:** security
**Status:** Accepted
**Deciders:** Claude (M2 S12, two-step sign-in: turn on and sign in with a code)

## Context

L2-072.3 lets any booker or artist turn on TOTP two-step sign-in with 10 single-use recovery codes, and
L2-066 makes it mandatory for administrators (M3). `accounts/sign-in-and-recover-access` leaves the
TOTP library `<TO SUPPLY>`; the M2 plan's D5 recommends `pragmarx/google2fa` with
`bacon/bacon-qr-code` (SVG) behind `Services/Accounts/TotpVerifier`.

The setup page must show a QR code. The frontend may not insert markup it did not write: ESLint bans
`[innerHTML]` and `bypassSecurityTrust*` (M2 S4), and Angular's sanitiser refuses `data:image/svg+xml`
URLs.

## Decision

1. **`pragmarx/google2fa` ^8** generates 32-character base32 keys (160 bits) and checks RFC 6238 codes:
   30-second steps, six digits, one step either side for clock drift. It reads the real clock, not the
   frozen e2e one, as the person's authenticator app does. `TotpVerifier` wraps it.
2. **`bacon/bacon-qr-code` ^3** renders the `otpauth://totp/Zamaro:{email}?secret=…&issuer=Zamaro`
   address as SVG, served by `GET /api/v1/account/two-factor/qr` (`image/svg+xml`, private, no-store,
   404 when no key is waiting). The setup page shows it with `<img src>` and an `alt` naming the
   account, beside the key in groups of four.
3. **Keys are stored with the field key** (`EncryptedField`, ADR-0020) in `users.two_factor_secret`;
   `mfa_enabled` turns true only when a first code confirms the key. **Recovery codes** are 8 characters
   from an alphabet without look-alikes (`xxxx-xxxx`), stored as SHA-256, used once, and replaced all
   together.
4. **The code step** is a 10-minute marker in the session after the right password; `POST
   /api/v1/session/two-factor` completes it with a new session ID. Wrong codes share the sign-in lockout.

## Options Considered

### Option 1: google2fa and bacon, QR as an API image (chosen)
- **Pros:** the plan's default; widely used; no frontend dependency; the image never passes through
  Angular's sanitiser or the markup bans.
- **Cons:** one more request on the setup page; the key travels in that response (same origin, private).

### Option 2: a QR library in the browser
- **Pros:** no QR endpoint.
- **Cons:** a new frontend dependency in the bundle for one page.

### Option 3: return the SVG in JSON and insert it
- **Pros:** one request.
- **Cons:** needs `[innerHTML]` or `bypassSecurityTrust*`, which the lint rules ban.

## Consequences

### Positive
- The admin enrolment in M3 reuses `EnableTwoFactor`, `TotpVerifier` and the challenge.
- e2e computes codes with `fixtures/totp.ts` from the key the page shows.

### Negative
- A code can be used twice within its window; replay protection is not in L2-072 and is left out.

## References

- `docs/detailed-designs/accounts/sign-in-and-recover-access/README.md`
- M2 plan D5, D21; ADR-0020
