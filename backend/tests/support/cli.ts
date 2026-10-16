import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { testEnvironment } from './api-process';

const backend = new URL('../../', import.meta.url);
const tsx = fileURLToPath(new URL('node_modules/tsx/dist/cli.mjs', backend));

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Runs one of the backend's CLI scripts (`npm run <script>`) against the test database. */
export function cli(
  script: string,
  args: string[] = [],
  overrides: Record<string, string> = {},
): CliResult {
  const result = spawnSync(process.execPath, [tsx, `src/cli/${script}.ts`, ...args], {
    cwd: backend,
    env: testEnvironment(overrides),
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
