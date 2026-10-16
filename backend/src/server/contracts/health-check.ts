/** One readiness dependency (L2-090.2): resolves when it answers, rejects when it does not. */
export interface HealthCheck {
  name: 'database' | 'cache' | 'queue';
  run: () => Promise<void>;
}
