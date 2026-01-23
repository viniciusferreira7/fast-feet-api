import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { PackageAssignedToADeliveryPersonEvent } from '@/domain/delivery/enterprise/events/package-assigned-to-a-delivery-person-event';
import type { SendNotificationUseCase } from '../application/use-cases/send-notification';

export class OnPackageAssignedSendNotification implements EventHandler {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewPackageNotification.bind(this),
      PackageAssignedToADeliveryPersonEvent.name
    );
  }

  private async sendNewPackageNotification({
    packageHistory,
    packageId,
  }: PackageAssignedToADeliveryPersonEvent) {
    const packageRecord = await this.packagesRepository.findById(
      packageId.toString()
    );

    if (!packageRecord) return;

    await this.sendNotificationUseCase.execute({
      title:
        packageHistory.description ?? 'Package assigned to a delivery person',
      content: `Delivery person was assigned to get a package: ${
        packageRecord.name.length > 10
          ? packageRecord.name.substring(0, 10).concat('...')
          : packageRecord.name
      }, the package code is: ${packageRecord.code.value}`,
      recipientId: packageRecord.recipientId.toString(),
    });
  }
}
