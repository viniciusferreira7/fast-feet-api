import type { PackageHistory } from '../../enterprise/entities/package-history';

export abstract class PackagesHistoryRepository {
  abstract register(data: PackageHistory): Promise<PackageHistory>;
  abstract findById(id: string): Promise<PackageHistory | null>;
}
