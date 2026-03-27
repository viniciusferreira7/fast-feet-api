import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CryptographyModule } from './cryptography/cryptography.module';

@Module({
  imports: [CryptographyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
