/**
 * A disk (ADR-0024): media served publicly, and the quarantine, documents and originals disks that
 * are never served. Local folders now; an S3-compatible adapter later, by configuration.
 */
export interface Storage {
  exists(key: string): Promise<boolean>;
  get(key: string): Promise<Buffer | null>;
  put(key: string, contents: Buffer | string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Every key under a prefix, in no particular order. */
  list(prefix?: string): Promise<string[]>;
}

export type DiskName = 'media' | 'quarantine' | 'documents' | 'originals';
