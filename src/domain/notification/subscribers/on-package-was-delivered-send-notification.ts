import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { PackageWasDeliveredEvent } from '@/domain/delivery/enterprise/events/package-was-delivered-event';
import { SendNotificationUseCase } from '../application/use-cases/send-notification';

@Injectable()
export class OnPackageWasDeliveredSendNotification implements EventHandler {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewPackageNotification.bind(this),
      PackageWasDeliveredEvent.name
    );
  }

  private async sendNewPackageNotification({
    packageHistory,
    packageId,
  }: PackageWasDeliveredEvent) {
    const packageRecord = await this.packagesRepository.findById(
      packageId.toString()
    );

    if (!packageRecord) return;

    await this.sendNotificationUseCase.execute({
      title: packageHistory.description ?? 'Package was delivered',
      content: `Your package ${
        packageRecord.name.length > 10
          ? packageRecord.name.substring(0, 10).concat('...')
          : packageRecord.name
      } has been delivered. Package code: ${packageRecord.code.value}`,
      recipientId: packageRecord.recipientId.toString(),
    });
  }
}
