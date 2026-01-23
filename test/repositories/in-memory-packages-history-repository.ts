import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { PackagesHistoryRepository } from '@/domain/delivery/application/repositories/packages-history-repository';
import type { PackageHistory } from '@/domain/delivery/enterprise/entities/package-history';

export class InMemoryPackagesHistoryRepository
  implements PackagesHistoryRepository
{
  public packagesHistory: PackageHistory[] = [];

  async register(data: PackageHistory): Promise<PackageHistory> {
    this.packagesHistory.push(data);

    return data;
  }

  async findById(id: string): Promise<PackageHistory | null> {
    const packageHistory = this.packagesHistory.find((history) =>
      history.id.equals(new UniqueEntityId(id))
    );

    return packageHistory ?? null;
  }
  async findManyByPackageId(
    packageId: string
  ): Promise<PackageHistory[] | null> {
    return this.packagesHistory.filter((item) =>
      item.packageId.equals(new UniqueEntityId(packageId))
    );
  }
}
