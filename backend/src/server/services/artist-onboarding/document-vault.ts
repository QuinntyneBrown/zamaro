import { randomBytes } from 'node:crypto';
import { disk } from '@/server/integrations/storage/disks';
import { decryptField, encryptField, open, seal } from '@/server/support/encryption/field-cipher';

/**
 * Private documents at rest (L2-049.1, L2-079.2, ADR-0025): each file is encrypted with its own
 * random data key (AES-256-GCM), and that key is wrapped with the versioned field key, so the
 * ciphertext on the documents disk means nothing without both. Objects live under random names.
 */
export interface StoredDocument {
  key: string;
  wrappedDataKey: string;
}

/** Encrypts and stores a document under a new random name, or under `key` (32 hex) to rewrite one. */
export async function storeDocument(plaintext: Buffer, key?: string): Promise<StoredDocument> {
  const objectKey = key ?? randomBytes(16).toString('hex');
  const dataKey = randomBytes(32);
  await disk('documents').put(objectKey, seal(plaintext, dataKey));
  return { key: objectKey, wrappedDataKey: encryptField(dataKey.toString('base64')) };
}

/** The plaintext of a stored document. */
export async function readDocument(document: StoredDocument): Promise<Buffer> {
  const dataKey = Buffer.from(decryptField(document.wrappedDataKey), 'base64');
  const stored = await disk('documents').get(document.key);
  if (stored === null) throw new Error('The document could not be read.');
  return open(stored, dataKey);
}

export async function deleteDocument(key: string): Promise<void> {
  await disk('documents').delete(key);
}
