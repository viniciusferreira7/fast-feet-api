import { Module } from '@nestjs/common';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { DrizzleService } from './drizzle/drizzle.service';
import { DrizzleAdminPeopleRepository } from './drizzle/repositories/drizzle-admin-people-repository';

@Module({
  providers: [
    DrizzleService,
    {
      provide: AdminPeopleRepository,
      useClass: DrizzleAdminPeopleRepository,
    },
  ],
  exports: [DrizzleService, AdminPeopleRepository],
})
export class DatabaseModule {}
