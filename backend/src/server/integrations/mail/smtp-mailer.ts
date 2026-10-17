import nodemailer, { type Transporter } from 'nodemailer';
import { MailTransportError, type EmailMessage, type Mailer } from '@/server/contracts/mailer';

/**
 * Sends each email over SMTP to the server `MAIL_URL` names (ADR-0019): Mailpit in development and
 * e2e, the provider's relay in production. A refusal or an unreachable server becomes a
 * MailTransportError, so the notifications queue retries the job (L2-065.2).
 */
export class SmtpMailer implements Mailer {
  private readonly transport: Transporter;

  constructor(url: string) {
    this.transport = nodemailer.createTransport(url);
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transport.sendMail({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      throw new MailTransportError(error instanceof Error ? error.message : String(error));
    }
  }
}
