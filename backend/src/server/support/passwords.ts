import { hash, verify } from '@node-rs/argon2';

// Argon2id (ADR-0027), with the same cost Laravel's hasher used.
const OPTIONS = { memoryCost: 65536, timeCost: 4, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}
