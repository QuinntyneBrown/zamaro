import type { Alert, OnCallAlerter } from '@/server/contracts/on-call-alerter';
import { redact } from '@/server/support/redaction';

/** Keeps every alert, redacted as the real adapter would send it (ADR-0002). */
export class FakeOnCallAlerter implements OnCallAlerter {
  readonly alerts: Alert[] = [];

  raise(alert: Alert): void {
    this.alerts.push(redact(alert) as Alert);
  }
}
