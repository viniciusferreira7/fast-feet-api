import { Pagination } from '@/core/entities/value-object/pagination';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import type {
  FindManyPackagesParams,
  FindNearByParams,
  PackagesRepository,
} from '@/domain/delivery/application/repositories/packages-repository';
import { Package } from '@/domain/delivery/enterprise/entities/package';
import { PackageCode } from '@/domain/delivery/enterprise/entities/value-object/package-code';
import type { Status } from '@/domain/delivery/enterprise/entities/value-object/package-status';
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

  async findByCode(code: string): Promise<Package | null> {
    const packageItem = this.packages.find((pkg) =>
      pkg.code.equals(
        new PackageCode({
          value: code,
        })
      )
    );

    if (!packageItem) return null;

    this.packagesHistoryRepository.packagesHistory.forEach((history) => {
      if (history.id.equals(packageItem.id)) {
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

  async findManyPackages(
    params: FindManyPackagesParams
  ): Promise<Pagination<Package>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 10;

    let filtered = this.packages;

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(search) ||
          pkg.code.value.toLowerCase().includes(search) ||
          pkg.recipientAddress.toLowerCase().includes(search)
      );
    }

    if (params.name) {
      const name = params.name.toLowerCase();
      filtered = filtered.filter((pkg) =>
        pkg.name.toLowerCase().includes(name)
      );
    }

    if (params.code) {
      const code = params.code.toLowerCase();
      filtered = filtered.filter((pkg) =>
        pkg.code.value.toLowerCase().includes(code)
      );
    }

    if (params.recipientAddress) {
      const address = params.recipientAddress.toLowerCase();
      filtered = filtered.filter((pkg) =>
        pkg.recipientAddress.toLowerCase().includes(address)
      );
    }

    if (params.status) {
      filtered = filtered.filter((pkg) => pkg.status.value === params.status);
    }

    if (params.postalCode) {
      const postalCode = params.postalCode;
      filtered = filtered.filter((pkg) =>
        pkg.postalCode.value.includes(postalCode)
      );
    }

    if (params.createdAtGte) {
      const createdAtGte = params.createdAtGte;
      filtered = filtered.filter((pkg) => pkg.createdAt >= createdAtGte);
    }

    if (params.updatedAtGte) {
      const updatedAtGte = params.updatedAtGte;
      filtered = filtered.filter(
        (pkg) => pkg.updatedAt != null && pkg.updatedAt >= updatedAtGte
      );
    }

    if (params.deliveredAtGte) {
      const deliveredAtGte = params.deliveredAtGte;
      filtered = filtered.filter(
        (pkg) => pkg.deliveredAt != null && pkg.deliveredAt >= deliveredAtGte
      );
    }

    const startIndex = (page - 1) * perPage;
    const paginated = filtered.slice(startIndex, startIndex + perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    return Pagination.create<Package>({
      page,
      perPage,
      totalPages,
      result: paginated,
    });
  }

  async findByDeliveryPersonId(
    deliveryPersonId: string,
    status: Status[]
  ): Promise<Package[]> {
    return this.packages.filter(
      (pkg) =>
        pkg.deliveryPersonId?.equals(new UniqueEntityId(deliveryPersonId)) &&
        status.includes(pkg.status.value)
    );
  }

  async findNearBy(params: FindNearByParams): Promise<Pagination<Package>> {
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
