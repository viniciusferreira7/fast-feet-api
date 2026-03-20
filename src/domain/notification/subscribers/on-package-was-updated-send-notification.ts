import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { PackageWasUpdatedEvent } from '@/domain/delivery/enterprise/events/package-was-updated-event';
import type { SendNotificationUseCase } from '../application/use-cases/send-notification';

export class OnPackageWasUpdatedSendNotification implements EventHandler {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewPackageNotification.bind(this),
      PackageWasUpdatedEvent.name
    );
  }

  private async sendNewPackageNotification({
    packageHistory,
    packageId,
  }: PackageWasUpdatedEvent) {
    const packageRecord = await this.packagesRepository.findById(
      packageId.toString()
    );

    if (!packageRecord) return;

    await this.sendNotificationUseCase.execute({
      title: packageHistory.description ?? 'Package was updated',
      content: `Your package ${
        packageRecord.name.length > 10
          ? packageRecord.name.substring(0, 10).concat('...')
          : packageRecord.name
      }. Package code: ${packageRecord.code.value}`,
      recipientId: packageRecord.recipientId.toString(),
    });
  }
}
