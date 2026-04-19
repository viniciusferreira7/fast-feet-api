import { Module } from '@nestjs/common';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { DeliveryPeopleRepository } from '@/domain/delivery/application/repositories/delivery-people-repository';
import { DrizzleService } from './drizzle/drizzle.service';
import { DrizzleAdminPeopleRepository } from './drizzle/repositories/drizzle-admin-people-repository';
import { DrizzleDeliveryPeopleRepository } from './drizzle/repositories/drizzle-delivery-people-repository';

@Module({
  providers: [
    DrizzleService,
    {
      provide: AdminPeopleRepository,
      useClass: DrizzleAdminPeopleRepository,
    },
    {
      provide: DeliveryPeopleRepository,
      useClass: DrizzleDeliveryPeopleRepository,
    },
  ],
  exports: [DrizzleService, AdminPeopleRepository, DeliveryPeopleRepository],
})
export class DatabaseModule {}
