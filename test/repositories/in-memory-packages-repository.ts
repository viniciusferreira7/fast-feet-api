import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import type { Package } from '@/domain/delivery/enterprise/entities/package';
import type { InMemoryPackagesHistoryRepository } from './in-memory-packages-history-repository';

export class InMemoryPackagesRepository implements PackagesRepository {
  public packages: Package[] = [];

  constructor(
    private readonly packagesHistoryRepository: InMemoryPackagesHistoryRepository
  ) {}

  async register(data: Package): Promise<Package> {
    this.packages.push(data);

    DomainEvents.dispatchEventsForEntity(data.id);
    return data;
  }

  async findById(id: string): Promise<Package | null> {
    const packageItem = this.packages.find((pkg) =>
      pkg.id.equals(new UniqueEntityId(id))
    );

    if (!packageItem) return null;

    this.packagesHistoryRepository.packagesHistory.forEach((history) => {
      if (history.packageId.equals(new UniqueEntityId(id))) {
        packageItem?.histories.add(history);
      }
    });

    return packageItem;
  }

  async update(data: Package): Promise<Package | null> {
    const packageIndex = this.packages.findIndex((pkg) =>
      pkg.id.equals(data.id)
    );

    if (packageIndex === -1) {
      return null;
    }

    this.packages[packageIndex] = data;

    this.packagesHistoryRepository.packagesHistory.forEach((history) => {
      if (history.packageId.equals(data.id)) {
        data?.histories.add(history);
      }
    });

    DomainEvents.dispatchEventsForEntity(data.id);

    return data;
  }
}
