import { randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

// Argon2id (ADR-0027), with the same cost Laravel's hasher used.
const OPTIONS = { memoryCost: 65536, timeCost: 4, parallelism: 1 };

export type PasswordVerifier = (hashed: string, password: string) => Promise<boolean>;

let verifier: PasswordVerifier | undefined;
let dummy: Promise<string> | undefined;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  if (verifier !== undefined) return verifier(hashed, password);
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

/** Binds another verifier (tests count the checks); `undefined` returns to Argon2id. */
export function usePasswordVerifier(next: PasswordVerifier | undefined): void {
  verifier = next;
}

/** A hash of nothing anyone knows, made once with the current cost so checking it takes as long. */
export function dummyHash(): Promise<string> {
  dummy ??= hash(randomBytes(30).toString('base64'), OPTIONS);
  return dummy;
}
