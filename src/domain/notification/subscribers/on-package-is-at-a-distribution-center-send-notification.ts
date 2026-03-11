import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { PackageAtDistributionCenterEvent } from '@/domain/delivery/enterprise/events/package-at-distribution-center-event';
import type { SendNotificationUseCase } from '../application/use-cases/send-notification';

export class OnPackageIsAtADistributionCenterSendNotification
  implements EventHandler
{
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewPackageNotification.bind(this),
      PackageAtDistributionCenterEvent.name
    );
  }

  private async sendNewPackageNotification({
    packageHistory,
    packageId,
  }: PackageAtDistributionCenterEvent) {
    const packageRecord = await this.packagesRepository.findById(
      packageId.toString()
    );

    if (!packageRecord) return;

    await this.sendNotificationUseCase.execute({
      title:
        packageHistory.description ??
        'Package arrived at a distribution center',
      content: `Your package ${
        packageRecord.name.length > 10
          ? packageRecord.name.substring(0, 10).concat('...')
          : packageRecord.name
      } has arrived at a distribution center. The package code is: ${packageRecord.code.value}`,
      recipientId: packageRecord.recipientId.toString(),
    });
  }
}
