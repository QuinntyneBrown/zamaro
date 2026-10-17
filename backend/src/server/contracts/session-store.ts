/** What a session holds; everything else a slice needs goes in `data` as JSON. */
export interface SessionData {
  /** The signed-in account, or none for a guest session. */
  userId?: number;
  /** When the person signed in (Unix seconds): the 30-day absolute limit starts here (L2-073.3). */
  startedAt?: number;
  /** The CSRF token the browser repeats in X-XSRF-TOKEN (L2-073.2). */
  csrfToken: string;
  /** Slice-specific marks: the two-factor challenge, the admin's code step and last activity. */
  [key: string]: unknown;
}

/**
 * Where sessions live (ADR-0015, ADR-0027): Redis in the application, memory in tests (ADR-0028).
 * Every write refreshes the idle expiry, so the lifetime is the idle limit.
 */
export interface SessionStore {
  read(id: string): Promise<SessionData | null>;
  write(id: string, data: SessionData, ttlSeconds: number): Promise<void>;
  destroy(id: string): Promise<void>;
}
