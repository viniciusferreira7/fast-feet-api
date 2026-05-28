import { Module } from '@nestjs/common';
import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification';
import { OnPackageAssignedToADeliveryPersonSendNotification } from '@/domain/notification/subscribers/on-package-assigned-send-notification';
import { OnPackageCanceledSendNotification } from '@/domain/notification/subscribers/on-package-canceled-send-notification';
import { OnPackageFailedDeliverySendNotification } from '@/domain/notification/subscribers/on-package-failed-delivery-send-notification';
import { OnPackageIsAtADistributionCenterSendNotification } from '@/domain/notification/subscribers/on-package-is-at-a-distribution-center-send-notification';
import { OnPackageIsInTransitSendNotification } from '@/domain/notification/subscribers/on-package-is-in-transit-send-notification';
import { OnPackagePickedUpSendNotification } from '@/domain/notification/subscribers/on-package-picked-up-send-notification';
import { OnPackageRegisteredSendNotification } from '@/domain/notification/subscribers/on-package-registered-send-notification';
import { OnPackageWasDeliveredSendNotification } from '@/domain/notification/subscribers/on-package-was-delivered-send-notification';
import { OnPackageWasUpdatedSendNotification } from '@/domain/notification/subscribers/on-package-was-updated-send-notification';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    OnPackageRegisteredSendNotification,
    OnPackageAssignedToADeliveryPersonSendNotification,
    OnPackagePickedUpSendNotification,
    OnPackageIsAtADistributionCenterSendNotification,
    OnPackageIsInTransitSendNotification,
    OnPackageWasDeliveredSendNotification,
    OnPackageFailedDeliverySendNotification,
    OnPackageWasUpdatedSendNotification,
    OnPackageCanceledSendNotification,
    SendNotificationUseCase,
  ],
})
export class EventsModule {}
