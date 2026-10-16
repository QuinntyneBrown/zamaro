/**
 * A key-value cache with expiry (ADR-0028): Redis in the application, in memory in tests. Values
 * are JSON-serialisable.
 */
export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  forget(key: string): Promise<void>;
}
