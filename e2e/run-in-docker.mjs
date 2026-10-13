// Runs Playwright inside the official Linux image, so captures do not depend on this machine's fonts
// (adapt-layout-to-screens). Baselines made here carry `-linux` in their name; a local run keeps
// using its own platform's set. The e2e API keeps running on the host: seed it here first, then
// point the container's web server at it.
//   npm run test:docker -- visual a11y [--update-snapshots]
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const IMAGE = 'mcr.microsoft.com/playwright:v1.64.0-noble';
const root = fileURLToPath(new URL('..', import.meta.url));

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
  { cwd: root, stdio: 'inherit' },
);
// Ruth Adeyemi, the fresh-booker route state's booker (fixtures/accounts.ts), made once per run.
execFileSync(
  'docker',
  [
    'compose',
    '--profile',
    'e2e',
    'exec',
    '-T',
    'api-e2e',
    'php',
    'artisan',
    'cast:booker',
    'ruth-adeyemi@example.ca',
  ],
  { cwd: root, stdio: 'inherit' },
);
execFileSync(
  'docker',
  [
    'run',
    '--rm',
    '--ipc=host',
    '--add-host=host.docker.internal:host-gateway',
    '-v',
    `${root}:/work`,
    '-w',
    '/work/e2e',
    '-e',
    'SKIP_E2E_SEED=1',
    '-e',
    'E2E_API_ORIGIN=http://host.docker.internal:8001',
    '-e',
    'E2E_MAILPIT_URL=http://host.docker.internal:8026',
    '-e',
    'CI=',
    IMAGE,
    'npx',
    'playwright',
    'test',
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);
