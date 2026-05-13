import { forwardRef, Module } from '@nestjs/common';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { AssignPackageToADeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/assign-package-to-a-delivery-person';
import { AuthenticateAdminPersonUseCase } from '@/domain/delivery/application/use-cases/authenticate-admin-person';
import { RegisterAdminPersonUseCase } from '@/domain/delivery/application/use-cases/register-admin-person';
import { SendAdminPersonCodeUseCase } from '@/domain/delivery/application/use-cases/send-admin-person-code';
import { ValidateAdminPersonCodeUseCase } from '@/domain/delivery/application/use-cases/validate-admin-person-code';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EmailModule } from '@/infra/email/email.module';
import { ValidationModule } from '../validation/validation.module';
import { AssignPackageToADeliveryPersonController } from './controllers/assign-package-to-a-delivery-person.controller';
import { AuthenticateAdminPersonController } from './controllers/authenticate-admin-person.controller';
import { RegisterAdminPersonController } from './controllers/register-admin-person.controller';
import { ResetAdminPersonPasswordController } from './controllers/reset-admin-person-password.controller';
import { SendAdminPersonCodeController } from './controllers/send-admin-person-code.controller';
import { ValidateAdminPersonCodeController } from './controllers/validate-admin-person-code.controller';
import { FetchHttpClient } from './fetch-http-client';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    CryptographyModule,
    forwardRef(() => ValidationModule),
  ],
  providers: [
    {
      provide: HttpClient,
      useClass: FetchHttpClient,
    },
    RoleGuard,
    AssignPackageToADeliveryPersonUseCase,
    RegisterAdminPersonUseCase,
    AuthenticateAdminPersonUseCase,
    SendAdminPersonCodeUseCase,
    ValidateAdminPersonCodeUseCase,
  ],
  exports: [HttpClient],
  controllers: [
    AssignPackageToADeliveryPersonController,
    RegisterAdminPersonController,
    AuthenticateAdminPersonController,
    SendAdminPersonCodeController,
    ValidateAdminPersonCodeController,
    ResetAdminPersonPasswordController,
  ],
})
export class HttpModule {}
