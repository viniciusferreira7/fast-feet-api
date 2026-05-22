import { forwardRef, Module } from '@nestjs/common';
import { PasswordValidator } from '@/domain/delivery/application/validation/password-validator';
import { PostalCodeValidator } from '@/domain/delivery/application/validation/postal-code-validator';
import { HttpModule } from '@/infra/http/http.module';
import { PasswordService } from './password.service';
import { PostalCodeService } from './postal-code.service';

@Module({
  imports: [forwardRef(() => HttpModule)],
  providers: [
    PasswordService,
    PostalCodeService,
    { provide: PasswordValidator, useClass: PasswordService },
    { provide: PostalCodeValidator, useClass: PostalCodeService },
  ],
  exports: [PasswordValidator, PostalCodeValidator],
})
export class ValidationModule {}
