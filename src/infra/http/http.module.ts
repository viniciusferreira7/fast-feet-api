import { Module } from '@nestjs/common';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { AssignPackageToADeliveryPersonController } from './controllers/assign-package-to-a-delivery-person.controller';
import { FetchHttpClient } from './fetch-http-client';

@Module({
  providers: [
    {
      provide: HttpClient,
      useClass: FetchHttpClient,
    },
  ],
  exports: [HttpClient],
  controllers: [AssignPackageToADeliveryPersonController],
})
export class HttpModule {}
