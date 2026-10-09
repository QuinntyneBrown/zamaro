import { execFileSync } from 'node:child_process';

// M1 is read-only, so the e2e database is reset and seeded once per run.
export default function globalSetup(): void {
  if (process.env['SKIP_E2E_SEED']) return;
  execFileSync(
    'docker',
    ['compose', '--profile', 'e2e', 'run', '--rm', '-T', 'api-e2e', 'php', 'artisan', 'migrate:fresh', '--seed', '--force'],
    { cwd: new URL('../..', import.meta.url), stdio: 'inherit' },
  );
}
