import { Module } from '@nestjs/common';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { AssignPackageToADeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/assign-package-to-a-delivery-person';
import { AssignPackageToADeliveryPersonController } from './controllers/assign-package-to-a-delivery-person.controller';
import { RegisterAdminPersonController } from './controllers/register-admin-person.controller';
import { FetchHttpClient } from './fetch-http-client';

@Module({
  providers: [
    {
      provide: HttpClient,
      useClass: FetchHttpClient,
    },
    AssignPackageToADeliveryPersonUseCase,
  ],
  exports: [HttpClient],
  controllers: [
    AssignPackageToADeliveryPersonController,
    RegisterAdminPersonController,
  ],
})
export class HttpModule {}
