import { Module } from '@nestjs/common';
import { EmailSender } from '@/domain/delivery/application/email/email-sender';
import { EmailService } from './email.service';

@Module({
  providers: [
    EmailService,
    {
      provide: EmailSender,
      useExisting: EmailService,
    },
  ],
  exports: [EmailSender, EmailService],
})
export class EmailModule {}
