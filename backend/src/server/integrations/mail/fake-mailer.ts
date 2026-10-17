import type { EmailMessage, Mailer } from '@/server/contracts/mailer';

/** Keeps every email instead of sending it, so tests can read what a person would receive (ADR-0028). */
export class FakeMailer implements Mailer {
  readonly sent: EmailMessage[] = [];
  private failure: Error | undefined;

  /** Refuses every email with the error, the way a mail server that is down would; undefined accepts again. */
  failWith(error: Error | undefined): void {
    this.failure = error;
  }

  send(message: EmailMessage): Promise<void> {
    if (this.failure !== undefined) return Promise.reject(this.failure);
    this.sent.push(message);
    return Promise.resolve();
  }
}
