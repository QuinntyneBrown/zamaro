import { closeDatabase } from '@/server/db/client';

/** Runs one CLI entry point: the work, then the pool closed, then the exit code. */
export function run(work: () => Promise<void>): void {
  work()
    .then(
      () => 0,
      (error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        return 1;
      },
    )
    .then(async (code) => {
      await closeDatabase();
      process.exitCode = code;
    })
    .catch(() => {
      process.exitCode = 1;
    });
}
