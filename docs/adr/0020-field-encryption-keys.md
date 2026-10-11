# ADR-0020: Field encryption with a versioned key that is not APP_KEY

**Date:** 2026-10-11
**Category:** security
**Status:** Accepted
**Deciders:** Claude (M2 S9, account settings: profile, church and contact phone)

## Context

L2-079.2 asks for phone numbers, reference contact details and VSC documents to be encrypted by the
application, with a key held outside the database, on top of the database's own encryption at rest.
S9 stores the first of them: a church's contact phone (`churches.phone`) and an artist's private
contact phone (`artists.contact_phone`, L2-025.4). M3 adds application references and VSC documents.

`security/protect-secrets-and-data` names `FieldEncrypter` (AES-256-GCM, a field key that is not
`APP_KEY`, values prefixed with a key version such as `v1:`) and the `EncryptedField` cast, and leaves
the rotation procedure `<TO SUPPLY>`. Laravel's own `encrypted` cast uses `APP_KEY`, which also signs
sessions and cookies, and its values carry no key version.

## Decision

1. **`App\Support\Encryption\FieldEncrypter`** encrypts with `Illuminate\Encryption\Encrypter` and
   cipher `aes-256-gcm`, keyed by `FIELD_ENCRYPTION_KEY` (32 bytes, `base64:`), never `APP_KEY`. A
   stored value is `{version}:{payload}`; the current version is `FIELD_ENCRYPTION_KEY_VERSION`
   (`v1`).
2. **Earlier keys stay readable**: `FIELD_ENCRYPTION_PREVIOUS_KEYS` lists `version:key` pairs,
   comma-separated. A value under a version the API does not hold fails to decrypt (a 500); it is
   never returned as text.
3. **`App\Casts\EncryptedField`** applies it on write and read. Encrypted columns are `text` and never
   used in a `WHERE` clause. Phones are stored in E.164 and shown as "905-555-0123".
4. **Keys by environment:** the test suite has its own key in `phpunit.xml`; `.env.example` carries a
   development-only key, which local and e2e use; production reads its key from the secrets manager
   (M10), and `ProductionSafetyServiceProvider` (M9) refuses to start without it.
5. **Rotation stays `<TO SUPPLY>` until M10** (M9's key-rotation slice writes the re-encryption
   command). The version prefix and previous keys are what it needs: add the new key as current, keep
   the old one in `FIELD_ENCRYPTION_PREVIOUS_KEYS`, re-encrypt, then drop it.

## Options Considered

### Option 1: a versioned field key of its own (chosen)
- **Pros:** the design's shape; a leaked `APP_KEY` does not expose phones, and the field key can rotate
  without logging everyone out; old values keep reading during a rotation.
- **Cons:** one more secret to provision and back up.

### Option 2: Laravel's `encrypted` cast
- **Pros:** built in.
- **Cons:** uses `APP_KEY`; no key version, so a rotation needs `APP_PREVIOUS_KEYS` for every encrypted
  thing at once; L2-079.2 asks for a key separate from the application's.

### Option 3: database-side encryption (pgcrypto)
- **Pros:** no application code.
- **Cons:** the key travels to the database in queries and logs, which L2-079.2's "outside the
  database" rules out.

## Consequences

### Positive
- New encrypted columns need only the cast.
- `FieldEncryptionTest` proves values are stored as `v1:` ciphertext, read after a key change, and are
  never read as text under an unknown key.

### Negative
- Encrypted columns cannot be searched or indexed.

### Risks
- Losing the field key loses every phone number; M10's secrets manager must back it up.

## References

- `docs/detailed-designs/security/protect-secrets-and-data/README.md`
- `docs/detailed-designs/accounts/manage-church-profile/README.md`
- `docs/detailed-designs/accounts/manage-account-settings/README.md`
- L2-079.2, L2-025.4; M2 plan S9
