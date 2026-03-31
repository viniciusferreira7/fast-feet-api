import { Module } from '@nestjs/common';
import { EmailSender } from '@/domain/delivery/application/email/email-sender';
import { EmailService } from './email.service';

@Module({
  providers: [
    {
      provide: EmailSender,
      useClass: EmailService,
    },
  ],
  exports: [EmailSender],
})
export class EmailModule {}
