import { execFileSync } from 'node:child_process';

/**
 * Runs an artisan command on the e2e API. By default it goes through the compose service
 * (`docker compose --profile e2e exec api-e2e php artisan …`); with `E2E_ARTISAN` set to a command
 * such as `php artisan`, it runs that in `E2E_ARTISAN_CWD` (the backend folder) against an API started
 * by hand, for machines without Docker.
 */
export function artisan(args: string[], mode: 'run' | 'exec' = 'exec'): void {
  const local = process.env['E2E_ARTISAN'];
  if (local) {
    const [command, ...prefix] = local.split(/\s+/);
    execFileSync(command!, [...prefix, ...args], {
      cwd: process.env['E2E_ARTISAN_CWD'] ?? new URL('../../backend', import.meta.url),
      stdio: mode === 'run' ? 'inherit' : 'pipe',
      env: { ...process.env, APP_ENV: 'e2e' },
    });
    return;
  }
  execFileSync(
    'docker',
    [
      'compose',
      '--profile',
      'e2e',
      ...(mode === 'run' ? ['run', '--rm', '-T'] : ['exec', '-T']),
      'api-e2e',
      'php',
      'artisan',
      ...args,
    ],
    {
      cwd: new URL('../..', import.meta.url),
      stdio: mode === 'run' ? 'inherit' : 'pipe',
    },
  );
}
