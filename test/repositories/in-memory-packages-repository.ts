import { Pagination } from '@/core/entities/value-object/pagination';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import type {
  FIndNearByParams,
  PackagesRepository,
} from '@/domain/delivery/application/repositories/packages-repository';
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

  async findNearBy(params: FIndNearByParams): Promise<Pagination<Package>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    const packagesWithSamePrefix = this.packages
      .filter((item) =>
        item.postalCode.value.startsWith(params.postalCode.value.slice(0, 5))
      )
      .slice(startIndex, endIndex);

    const totalPages = Math.ceil(packagesWithSamePrefix.length / perPage);

    const pagination = Pagination.create<Package>({
      page,
      perPage,
      totalPages,
      result: packagesWithSamePrefix,
    });

    return pagination;
  }
}
