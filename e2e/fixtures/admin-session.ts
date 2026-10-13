import type { BrowserContext } from '@playwright/test';
import { accounts, signIn } from './accounts';

/**
 * Signs Priya Nair, the seeded administrator, into a browser context through the API: her password,
 * then a code computed from her seeded key (secure-admin-access). Every page opened in the context
 * is then an administrator's, and the web server serves it the admin application.
 */
export async function signInAsAdministrator(context: BrowserContext): Promise<void> {
  await signIn(context.request, accounts.priya.email);
}
