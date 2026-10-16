import { AsyncLocalStorage } from 'node:async_hooks';

/** What every log line written during a request carries (L2-093.1). */
export interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  context: RequestContext,
  work: () => Promise<T>,
): Promise<T> {
  return storage.run(context, work);
}

export function currentRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
