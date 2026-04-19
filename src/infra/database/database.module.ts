import { Module } from '@nestjs/common';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { AttachmentsRepository } from '@/domain/delivery/application/repositories/attachments-repository';
import { DeliveryPeopleRepository } from '@/domain/delivery/application/repositories/delivery-people-repository';
import { EmailVerificationsRepository } from '@/domain/delivery/application/repositories/email-verifications-repository';
import { PackageAttachmentsRepository } from '@/domain/delivery/application/repositories/package-attachments-repository';
import { PackagesHistoryRepository } from '@/domain/delivery/application/repositories/packages-history-repository';
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import { DrizzleService } from './drizzle/drizzle.service';
import { DrizzleAdminPeopleRepository } from './drizzle/repositories/drizzle-admin-people-repository';
import { DrizzleAttachmentsRepository } from './drizzle/repositories/drizzle-attachments-repository';
import { DrizzleDeliveryPeopleRepository } from './drizzle/repositories/drizzle-delivery-people-repository';
import { DrizzleEmailVerificationsRepository } from './drizzle/repositories/drizzle-email-verifications-repository';
import { DrizzleNotificationsRepository } from './drizzle/repositories/drizzle-notifications-repository';
import { DrizzlePackageAttachmentsRepository } from './drizzle/repositories/drizzle-package-attachments-repository';
import { DrizzlePackagesHistoryRepository } from './drizzle/repositories/drizzle-packages-history-repository';
import { DrizzlePackagesRepository } from './drizzle/repositories/drizzle-packages-repository';
import { DrizzleRecipientPeopleRepository } from './drizzle/repositories/drizzle-recipient-people-repository';

@Module({
  providers: [
    DrizzleService,
    { provide: AdminPeopleRepository, useClass: DrizzleAdminPeopleRepository },
    {
      provide: DeliveryPeopleRepository,
      useClass: DrizzleDeliveryPeopleRepository,
    },
    {
      provide: RecipientPeopleRepository,
      useClass: DrizzleRecipientPeopleRepository,
    },
    {
      provide: EmailVerificationsRepository,
      useClass: DrizzleEmailVerificationsRepository,
    },
    { provide: AttachmentsRepository, useClass: DrizzleAttachmentsRepository },
    {
      provide: PackageAttachmentsRepository,
      useClass: DrizzlePackageAttachmentsRepository,
    },
    {
      provide: PackagesHistoryRepository,
      useClass: DrizzlePackagesHistoryRepository,
    },
    { provide: PackagesRepository, useClass: DrizzlePackagesRepository },
    {
      provide: NotificationsRepository,
      useClass: DrizzleNotificationsRepository,
    },
  ],
  exports: [
    DrizzleService,
    AdminPeopleRepository,
    DeliveryPeopleRepository,
    RecipientPeopleRepository,
    EmailVerificationsRepository,
    AttachmentsRepository,
    PackageAttachmentsRepository,
    PackagesHistoryRepository,
    PackagesRepository,
    NotificationsRepository,
  ],
})
export class DatabaseModule {}
