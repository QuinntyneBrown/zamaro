import pino, { type Logger } from 'pino';
import { config } from '@config/zamaro';
import { currentRequestId } from './request-context';

let instance: Logger | undefined;

/**
 * JSON lines on stderr, one object per line, each carrying the release and the current request ID
 * (L2-093.1, ADR-0005). Writes are synchronous so a line is out before the response that caused it.
 */
export function logger(): Logger {
  instance ??= pino(
    {
      level: config().debug ? 'debug' : 'info',
      base: { release: config().release },
      timestamp: pino.stdTimeFunctions.isoTime,
      mixin: () => {
        const requestId = currentRequestId();
        return requestId === undefined ? {} : { requestId };
      },
    },
    pino.destination({ fd: 2, sync: true }),
  );
  return instance;
}
