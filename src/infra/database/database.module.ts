import { Module } from '@nestjs/common';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { DeliveryPeopleRepository } from '@/domain/delivery/application/repositories/delivery-people-repository';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import { DrizzleService } from './drizzle/drizzle.service';
import { DrizzleAdminPeopleRepository } from './drizzle/repositories/drizzle-admin-people-repository';
import { DrizzleDeliveryPeopleRepository } from './drizzle/repositories/drizzle-delivery-people-repository';
import { DrizzleRecipientPeopleRepository } from './drizzle/repositories/drizzle-recipient-people-repository';

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
    {
      provide: RecipientPeopleRepository,
      useClass: DrizzleRecipientPeopleRepository,
    },
  ],
  exports: [
    DrizzleService,
    AdminPeopleRepository,
    DeliveryPeopleRepository,
    RecipientPeopleRepository,
  ],
})
export class DatabaseModule {}
