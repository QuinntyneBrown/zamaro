/** What locates a failure, such as the job name; never a request body. */
export type ReportContext = Record<string, string | number | boolean | null | undefined>;

/**
 * Sends an error to the error tracking service with the request ID and release version (L2-093.2,
 * operations/monitor-health-and-errors). The vendor is chosen in M10; until then the fake is bound
 * (ADR-0002).
 */
export interface ErrorReporter {
  report(
    error: Error,
    requestId: string | undefined,
    release: string,
    context?: ReportContext,
  ): void;
}
