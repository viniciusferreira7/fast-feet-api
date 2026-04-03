import { Module } from '@nestjs/common';
import { HttpModule } from '@/infra/http/http.module';
import { PasswordService } from './password.service';
import { PostalCodeService } from './postal-code.service';

@Module({
  imports: [HttpModule],
  providers: [PasswordService, PostalCodeService],
})
export class ValidationModule {}
