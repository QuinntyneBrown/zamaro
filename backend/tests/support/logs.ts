import { Writable } from 'node:stream';
import { useLogDestination } from '@/server/support/logger';

/** Captures the API's JSON log lines for the current test file; `restore()` returns them to stderr. */
export function captureLogs(): { lines: () => Record<string, unknown>[]; restore: () => void } {
  const captured: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      for (const line of chunk.toString().split('\n')) {
        if (line.startsWith('{')) captured.push(JSON.parse(line) as Record<string, unknown>);
      }
      callback();
    },
  });
  useLogDestination(stream);
  return {
    lines: () => captured,
    restore: () => {
      useLogDestination(undefined);
    },
  };
}
