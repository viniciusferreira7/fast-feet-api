import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { PackageRegisteredEvent } from '@/domain/delivery/enterprise/events/package-registered-event';
import type { SendNotificationUseCase } from '../application/use-cases/send-notification';

export class OnPackageRegisteredSendNotification implements EventHandler {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendPackageRegisteredNotification.bind(this),
      PackageRegisteredEvent.name
    );
  }

  private async sendPackageRegisteredNotification({
    packageHistory,
    packageId,
  }: PackageRegisteredEvent) {
    const packageRecord = await this.packagesRepository.findById(
      packageId.toString()
    );

    if (!packageRecord) return;

    await this.sendNotificationUseCase.execute({
      title: packageHistory.description ?? 'Package registered',
      content: `Your package "${
        packageRecord.name.length > 20
          ? packageRecord.name.substring(0, 20).concat('...')
          : packageRecord.name
      }" has been registered successfully. Package code: ${
        packageRecord.code.value
      }`,
      recipientId: packageRecord.recipientId.toString(),
    });
  }
}
