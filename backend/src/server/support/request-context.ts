import { AsyncLocalStorage } from 'node:async_hooks';
import type { Session } from '@/server/http/session';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { HttpProblem, ProblemType } from './problems';

/** What every log line and action during a request can reach (L2-093.1): the ID, the session, the person. */
export interface RequestContext {
  requestId: string;
  session: Session | undefined;
  user: CurrentUser | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  context: RequestContext,
  work: (context: RequestContext) => Promise<T>,
): Promise<T> {
  return storage.run(context, () => work(context));
}

export function currentRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/** The request's session; undefined for a stateless caller or outside a request. */
export function currentSession(): Session | undefined {
  return storage.getStore()?.session;
}

/** The signed-in person, or null for a guest. */
export function currentUser(): CurrentUser | null {
  return storage.getStore()?.user ?? null;
}

/** The signed-in person; a guest reaching here is a 401 problem. */
export function requireUser(): CurrentUser {
  const user = currentUser();
  if (user === null) {
    throw new HttpProblem(ProblemType.Unauthenticated, {
      detail: 'This needs a signed-in account.',
    });
  }
  return user;
}

/** The request's session; a stateless caller reaching here is a 401 problem. */
export function requireSession(): Session {
  const session = currentSession();
  if (session === undefined) {
    throw new HttpProblem(ProblemType.Unauthenticated, {
      detail: 'This needs a signed-in account.',
    });
  }
  return session;
}
