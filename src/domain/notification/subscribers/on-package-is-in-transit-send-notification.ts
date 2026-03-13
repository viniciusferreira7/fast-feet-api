import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { PackageAssignedToADeliveryPersonEvent } from '@/domain/delivery/enterprise/events/package-assigned-to-a-delivery-person-event';
import { PackageIsInTransitEvent } from '@/domain/delivery/enterprise/events/package-is-in-transit';
import type { SendNotificationUseCase } from '../application/use-cases/send-notification';

export class OnPackageIsInTransitSendNotification implements EventHandler {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewPackageNotification.bind(this),
      PackageIsInTransitEvent.name
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
      title: packageHistory.description ?? 'Your package is now in transit',
      content: `A delivery person has been assigned to pick up your package "${
        packageRecord.name.length > 10
          ? packageRecord.name.substring(0, 10).concat('...')
          : packageRecord.name
      }". Package code: ${packageRecord.code.value}.`,
      recipientId: packageRecord.recipientId.toString(),
    });
  }
}
