import type { EmailMessage, Mailer } from '@/server/contracts/mailer';

/** Keeps every email instead of sending it, so tests can read what a person would receive (ADR-0028). */
export class FakeMailer implements Mailer {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }
}
