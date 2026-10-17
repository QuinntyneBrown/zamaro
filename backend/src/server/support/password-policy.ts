import { breachedPasswordChecker } from '@/server/integrations/bindings';

/**
 * L2-072.1: a new password is 12 to 128 characters and not in a known data breach, or it is refused
 * with the reason (accounts/sign-in-and-recover-access). Shared by every form that sets a password.
 */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/** The reason the password is refused, or undefined when it may be used. */
export async function passwordPolicyError(password: string): Promise<string | undefined> {
  const length = Array.from(password).length;
  if (length < PASSWORD_MIN) {
    return `This one has ${String(length)} characters. Use at least ${String(PASSWORD_MIN)}.`;
  }
  if (length > PASSWORD_MAX) {
    return `This one has ${String(length)} characters. Use at most ${String(PASSWORD_MAX)}.`;
  }
  if (await breachedPasswordChecker().isBreached(password)) {
    return 'This password appears in a known data breach. Choose another.';
  }
  return undefined;
}
