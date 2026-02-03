import type { EmailSender } from '@/domain/delivery/application/email/email-sender';

export class FakeEmailSender implements EmailSender {
  public sentEmails: Array<{
    title: string;
    content: string;
    to: string;
  }> = [];

  async send(title: string, content: string, to: string): Promise<boolean> {
    this.sentEmails.push({
      title,
      content,
      to,
    });

    return true;
  }
}
