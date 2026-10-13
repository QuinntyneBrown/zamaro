# ADR-0024: Upload storage on local disks behind Laravel's filesystem ports until object storage

**Date:** 2026-10-13
**Category:** backend
**Status:** Accepted
**Deciders:** Claude (M3 S6), with the user's OK on M3 D1

## Context

`security/scan-and-serve-uploads` keeps uploads in object storage under `quarantine/`, `documents/`
and `originals/` prefixes in a Canadian region. M1 serves media from a local disk, ADR-0002 notes that
MinIO is no longer pullable, and the object-storage choice belongs to M4's media work. M3 needs the
Vulnerable Sector Check upload pipeline before any of that exists.

## Decision

1. **Three disks, not three prefixes.** `config/filesystems.php` defines `quarantine`, `documents` and
   `originals` on the `local` driver (`storage/app/{name}`), none of them served. `config/zamaro.php`
   maps each part of the pipeline to a disk name (`zamaro.uploads.disks`), overridable by environment.
2. **Every read and write goes through `Storage::disk(...)`.** `ReceiveUpload`, `ScanUpload`,
   `PromoteUpload`, `RejectInfectedUpload` and `DocumentVault` know nothing about paths or buckets.
   Tests use `Storage::fake()`.
3. **Private documents are streamed by the API** (`PrivateDocumentController`, M3 S7), never through
   pre-signed bucket URLs, so moving the disks to S3-compatible storage in M4 is a configuration change
   and the signed-URL contract does not move.
4. **Upload routes carry their own body limit.** `uploads:{kilobytes}` on a route (`AcceptsUpload`)
   lets `LimitRequestBodySize` and `EnsureJsonRequest` accept a multipart body up to a hard cap (32 MB
   for the check), while the request's own rule gives the person the 10 MB message first.

## Options Considered

### Option 1: local disks behind the filesystem ports (chosen)
- **Pros:** the pipeline ships now; the storage swap is config; tests fake the disks.
- **Cons:** a single API host holds the files until M4; no CDN rule yet.

### Option 2: bring object storage forward
- **Cons:** the vendor choice and its compose service belong with M4's media design and ADR.

## Consequences

### Positive
- The pipeline's behaviour (type by content, quarantine, scan, random names, envelope encryption) is
  proven before storage changes under it.

### Negative
- `storage/app/{quarantine,documents,originals}` must be writable and backed up until M4.

## Links
- ADR-0002, ADR-0025, `docs/detailed-designs/security/scan-and-serve-uploads/README.md`
