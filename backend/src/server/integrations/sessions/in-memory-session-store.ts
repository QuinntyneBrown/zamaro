import type { SessionData, SessionStore } from '@/server/contracts/session-store';
import { now } from '@/server/support/clock';

/** Sessions in memory for tests and single-process development; they expire by the API's clock. */
export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, { data: string; expiresAt: number }>();

  read(id: string): Promise<SessionData | null> {
    const entry = this.sessions.get(id);
    if (entry === undefined) return Promise.resolve(null);
    if (entry.expiresAt <= now().toMillis()) {
      this.sessions.delete(id);
      return Promise.resolve(null);
    }
    return Promise.resolve(JSON.parse(entry.data) as SessionData);
  }

  write(id: string, data: SessionData, ttlSeconds: number): Promise<void> {
    this.sessions.set(id, {
      data: JSON.stringify(data),
      expiresAt: now().toMillis() + ttlSeconds * 1000,
    });
    return Promise.resolve();
  }

  destroy(id: string): Promise<void> {
    this.sessions.delete(id);
    return Promise.resolve();
  }
}
