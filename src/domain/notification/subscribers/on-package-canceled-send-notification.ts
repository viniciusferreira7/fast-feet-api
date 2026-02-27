import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { PackageCanceledEvent } from '@/domain/delivery/enterprise/events/package-canceled-event';
import type { SendNotificationUseCase } from '../application/use-cases/send-notification';

export class OnPackageCanceledSendNotification implements EventHandler {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewPackageNotification.bind(this),
      PackageCanceledEvent.name
    );
  }

  private async sendNewPackageNotification({
    packageHistory,
    packageId,
  }: PackageCanceledEvent) {
    const packageRecord = await this.packagesRepository.findById(
      packageId.toString()
    );

    if (!packageRecord) return;

    await this.sendNotificationUseCase.execute({
      title: packageHistory.description ?? 'Package canceled',
      content: `Package was canceled: ${
        packageRecord.name.length > 10
          ? packageRecord.name.substring(0, 10).concat('...')
          : packageRecord.name
      }, the package code is: ${packageRecord.code.value}`,
      recipientId: packageRecord.recipientId.toString(),
    });
  }
}
