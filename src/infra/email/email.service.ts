import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailSender } from '@/domain/delivery/application/email/email-sender';
import { EnvService } from '../env/env.service';
import { buildEmailHtml } from './build-email-html';

@Injectable()
export class EmailService implements EmailSender {
  protected resend: Resend;
  private email: string;

  constructor(private readonly envService: EnvService) {
    this.resend = new Resend(this.envService.get('RESEND_API_KEY'));
    this.email = this.envService.get('EMAIL');
  }

  async send(title: string, content: string, to: string): Promise<boolean> {
    const createEmailResponse = await this.resend.emails.send({
      from: `Fast Feet ${this.email}`,
      to: to,
      subject: title,
      html: buildEmailHtml(title, content),
    });

    if (createEmailResponse.error) return false;

    return true;
  }
}
