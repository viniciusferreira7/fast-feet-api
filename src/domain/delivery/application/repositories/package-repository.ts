import type { Package } from '../../enterprise/entities/package';

export abstract class PackageRepository {
  abstract register(data: Package): Promise<Package>;
}
