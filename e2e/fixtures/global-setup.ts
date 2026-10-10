import { execFileSync } from 'node:child_process';
import { clearMailbox } from './mailbox';

// The e2e database is reset and seeded once per run, and Mailpit starts empty. Specs that change
// data use fresh bookers (accounts.ts), so the seeded cast stays as the mocks show it.
export default async function globalSetup(): Promise<void> {
  if (process.env['SKIP_E2E_SEED']) return;
  execFileSync(
    'docker',
    [
      'compose',
      '--profile',
      'e2e',
      'run',
      '--rm',
      '-T',
      'api-e2e',
      'php',
      'artisan',
      'migrate:fresh',
      '--seed',
      '--force',
    ],
    { cwd: new URL('../..', import.meta.url), stdio: 'inherit' },
  );
  await clearMailbox();
}
