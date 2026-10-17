/** One email as Zamaro sends it: from Zamaro, to one person, with HTML and text parts (ADR-0019). */
export interface EmailMessage {
  from: { name: string; address: string };
  to: { name: string; address: string };
  subject: string;
  html: string;
  text: string;
}

/**
 * Delivers one email (notifications/send-transactional-emails). The SMTP adapter runs in the
 * application; tests bind the fake and read what was sent (ADR-0028).
 */
export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}
