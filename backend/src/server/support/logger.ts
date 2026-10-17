import pino, { type DestinationStream, type Logger } from 'pino';
import { config } from '@config/zamaro';
import { redact } from './redaction';
import { currentRequestId } from './request-context';

let instance: Logger | undefined;
let destination: DestinationStream | undefined;

/**
 * JSON lines on stderr, one object per line, each carrying the release and the current request ID
 * (L2-093.1, ADR-0005). Every object is redacted before it is written (L2-079.3). Writes are
 * synchronous so a line is out before the response that caused it.
 */
export function logger(): Logger {
  instance ??= pino(
    {
      level: config().debug ? 'debug' : 'info',
      base: { release: config().release },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { log: (object) => redact(object) as Record<string, unknown> },
      mixin: () => {
        const requestId = currentRequestId();
        return requestId === undefined ? {} : { requestId };
      },
    },
    destination ?? pino.destination({ fd: 2, sync: true }),
  );
  return instance;
}

/** Sends the log lines somewhere else (tests capture them); `undefined` returns to stderr. */
export function useLogDestination(next: DestinationStream | undefined): void {
  destination = next;
  instance = undefined;
}
