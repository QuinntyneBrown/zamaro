import { execFileSync } from 'node:child_process';

/**
 * Runs one of the backend's `npm run` scripts (`src/cli/*.ts`, ADR-0027) on the e2e API. By default it
 * goes through the compose service (`docker compose --profile e2e exec api-e2e npm run <script> -- …`);
 * with `E2E_CLI` set to a command such as `npm run`, it runs that in `E2E_CLI_CWD` (the backend folder)
 * against an API started by hand, for machines without Docker.
 */
export function cli(args: string[], mode: 'run' | 'exec' = 'exec'): void {
  const [script, ...scriptArgs] = args;
  const npmArgs = [script!, '--', ...scriptArgs];
  const local = process.env['E2E_CLI'];
  if (local) {
    const [command, ...prefix] = local.split(/\s+/);
    execFileSync(command!, [...prefix, ...npmArgs], {
      cwd: process.env['E2E_CLI_CWD'] ?? new URL('../../backend', import.meta.url),
      stdio: mode === 'run' ? 'inherit' : 'pipe',
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
      'npm',
      'run',
      ...npmArgs,
    ],
    {
      cwd: new URL('../..', import.meta.url),
      stdio: mode === 'run' ? 'inherit' : 'pipe',
    },
  );
}
