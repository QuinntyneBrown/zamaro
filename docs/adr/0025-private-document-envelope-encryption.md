# ADR-0025: Private documents are encrypted per file with a wrapped data key

**Date:** 2026-10-13
**Category:** security
**Status:** Accepted
**Deciders:** Claude (M3 S6)

## Context

L2-049.1 stores a Vulnerable Sector Check encrypted; L2-079.2 encrypts personal data at the
application level with a key held outside the database. Two designs disagreed: `scan-and-serve-uploads`
says "encrypted with the field key"; `verify-vulnerable-sector-check` says `DocumentVault` wraps a fresh
data key per file with a key-encryption key. ADR-0020 already gives the API a versioned field key
(`FieldEncrypter`), never `APP_KEY`.

## Decision

`App\Services\ArtistOnboarding\DocumentVault` (envelope encryption):

1. Each document gets a fresh random 256-bit data key. The bytes are encrypted with AES-256-GCM
   (12-byte IV, 16-byte tag) and stored on the documents disk under a random 32-hex name as
   `iv || tag || ciphertext`.
2. The data key is wrapped with the versioned field key through `FieldEncrypter`, so the wrapped key
   is `{version}:{payload}` and keeps decrypting after the field key rotates. The wrapped key lives
   on the check row (`wrapped_data_key`), the object name in `storage_key`.
3. Reading needs both the row and the object; neither alone yields the document. Deleting the object
   deletes the document.

## Options Considered

### Option 1: envelope encryption with the field key as the key-encryption key (chosen)
- **Pros:** rotation re-wraps small keys, not files; one compromised data key exposes one file; the
  key holder is the one ADR-0020 already has.
- **Cons:** two secrets to keep together per document.

### Option 2: encrypt each file directly with the field key
- **Cons:** rotation means re-encrypting every document; one key covers every file.

## Consequences

### Positive
- The documents disk can move to object storage (ADR-0024) with the same ciphertext.

### Negative
- A lost `wrapped_data_key` loses the document; the row and the object are backed up together.

## Links
- ADR-0020, ADR-0024, `docs/detailed-designs/artist-onboarding/verify-vulnerable-sector-check/README.md`
