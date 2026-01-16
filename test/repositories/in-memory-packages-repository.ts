import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import type { Package } from '@/domain/delivery/enterprise/entities/package';

export class InMemoryPackagesRepository implements PackagesRepository {
  public packages: Package[] = [];

  async register(data: Package): Promise<Package> {
    this.packages.push(data);

    DomainEvents.dispatchEventsForEntity(data.id);
    return data;
  }

  async findById(id: string): Promise<Package | null> {
    const packageItem = this.packages.find((pkg) =>
      pkg.id.equals(new UniqueEntityId(id))
    );

    return packageItem ?? null;
  }

  async update(data: Package): Promise<Package | null> {
    const packageIndex = this.packages.findIndex((pkg) =>
      pkg.id.equals(data.id)
    );

    if (packageIndex === -1) {
      return null;
    }

    this.packages[packageIndex] = data;

    DomainEvents.dispatchEventsForEntity(data.id);

    return data;
  }
}
