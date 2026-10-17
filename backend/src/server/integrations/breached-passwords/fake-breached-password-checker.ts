import { config } from '@config/zamaro';
import type { BreachedPasswordChecker } from '@/server/contracts/breached-password-checker';

/**
 * Deterministic breach check for development and tests (ADR-0002): a password is breached when it
 * is on the configured list (ZAMARO_FAKE_BREACHED_PASSWORDS).
 */
export class FakeBreachedPasswordChecker implements BreachedPasswordChecker {
  isBreached(password: string): Promise<boolean> {
    return Promise.resolve(config().fakes.breachedPasswords.includes(password));
  }
}
