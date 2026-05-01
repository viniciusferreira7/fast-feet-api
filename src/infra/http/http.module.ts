import { forwardRef, Module } from '@nestjs/common';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { AssignPackageToADeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/assign-package-to-a-delivery-person';
import { RegisterAdminPersonUseCase } from '@/domain/delivery/application/use-cases/register-admin-person';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { ValidationModule } from '../validation/validation.module';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import { AssignPackageToADeliveryPersonController } from './controllers/assign-package-to-a-delivery-person.controller';
import { RegisterAdminPersonController } from './controllers/register-admin-person.controller';
import { FetchHttpClient } from './fetch-http-client';

@Module({
  imports: [
    DatabaseModule,
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
  ],
  exports: [HttpClient],
  controllers: [
    AssignPackageToADeliveryPersonController,
    RegisterAdminPersonController,
  ],
})
export class HttpModule {}
