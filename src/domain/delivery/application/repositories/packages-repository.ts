import type { Package } from '../../enterprise/entities/package';

export abstract class PackagesRepository {
  abstract register(data: Package): Promise<Package>;
}
