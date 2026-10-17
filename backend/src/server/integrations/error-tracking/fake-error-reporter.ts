import type { ErrorReporter, ReportContext } from '@/server/contracts/error-reporter';
import { redact } from '@/server/support/redaction';

/** Keeps every report, redacted as the real adapter would send it (ADR-0002). */
export class FakeErrorReporter implements ErrorReporter {
  readonly reports: {
    error: Error;
    requestId: string | undefined;
    release: string;
    context: ReportContext;
  }[] = [];

  report(
    error: Error,
    requestId: string | undefined,
    release: string,
    context: ReportContext = {},
  ): void {
    this.reports.push({ error, requestId, release, context: redact(context) as ReportContext });
  }
}
