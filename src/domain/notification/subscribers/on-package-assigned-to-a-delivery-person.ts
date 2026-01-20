import { DomainEvents } from '@/core/events/domain-events';
import type { EventHandler } from '@/core/events/event-handler';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import type { RegisterPackageHistoryUseCase } from '@/domain/delivery/application/use-cases/register-package-history';
import { PackageAssignedToADeliveryPersonEvent } from '@/domain/delivery/enterprise/events/package-assigned-to-a-delivery-person-event';

export class OnPackageAssignedToADeliveryPerson implements EventHandler {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly registerPackageHistoryUseCase: RegisterPackageHistoryUseCase
  ) {}

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

    const packageHistoryRecord =
      await this.registerPackageHistoryUseCase.execute({
        packageHistoryData: {
          packageId: packageHistory.packageId,
          authorId: packageHistory.authorId,
          createdAt: packageHistory.createdAt,
          deliveryPersonId: packageHistory.deliveryPersonId,
          description: packageHistory.description,
          fromStatus: packageHistory.fromStatus,
          toStatus: packageHistory.toStatus,
        },
      });

    if (packageHistoryRecord.isLeft()) return;
  }
}
