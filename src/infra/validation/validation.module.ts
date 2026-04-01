import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { PostalCodeService } from './postal-code.service';

@Module({
  providers: [PasswordService, PostalCodeService],
})
export class ValidationModule {}
