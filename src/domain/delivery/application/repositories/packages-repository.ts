import type { Package } from '../../enterprise/entities/package';

export abstract class PackagesRepository {
  abstract register(data: Package): Promise<Package>;
  abstract findById(id: string): Promise<Package | null>;
  abstract update(data: Package): Promise<Package | null>;
}
