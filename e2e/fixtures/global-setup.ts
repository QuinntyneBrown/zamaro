import { createBooker, RUTH } from './accounts';
import { artisan } from './artisan';
import { clearMailbox } from './mailbox';

// The e2e database is reset and seeded once per run, and Mailpit starts empty. Specs that change
// data use fresh bookers (accounts.ts), so the seeded cast stays as the mocks show it.
export default async function globalSetup(): Promise<void> {
  if (process.env['SKIP_E2E_SEED']) return;
  artisan(['migrate:fresh', '--seed', '--force'], 'run');
  createBooker(RUTH);
  await clearMailbox();
}
