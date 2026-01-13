import type { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import type { Package } from '@/domain/delivery/enterprise/entities/package';

export class InMemoryPackagesRepository implements PackagesRepository {
  public packages: Package[] = [];

  async register(data: Package): Promise<Package> {
    this.packages.push(data);
    return data;
  }
}
