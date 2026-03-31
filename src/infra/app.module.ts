import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CryptographyModule } from './cryptography/cryptography.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [CryptographyModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
