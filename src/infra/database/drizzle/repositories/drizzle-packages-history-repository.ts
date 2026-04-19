import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { PackagesHistoryRepository } from '@/domain/delivery/application/repositories/packages-history-repository';
import type { PackageHistory } from '@/domain/delivery/enterprise/entities/package-history';
import { DrizzleService } from '../drizzle.service';
import { DrizzlePackageHistoryMapper } from '../mappers/drizzle-package-history-mapper';
import { packageHistories } from '../schema';

@Injectable()
export class DrizzlePackagesHistoryRepository
  implements PackagesHistoryRepository
{
  constructor(private readonly drizzleService: DrizzleService) {}

  public async register(data: PackageHistory): Promise<PackageHistory> {
    const raw = DrizzlePackageHistoryMapper.toPersistence(data);

    await this.drizzleService.db.insert(packageHistories).values(raw);

    return DrizzlePackageHistoryMapper.toDomain(raw);
  }

  public async findById(id: string): Promise<PackageHistory | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(packageHistories)
      .where(eq(packageHistories.id, id));

    if (!row) return null;

    return DrizzlePackageHistoryMapper.toDomain(row);
  }

  public async findManyByPackageId(
    packageId: string
  ): Promise<PackageHistory[] | null> {
    const rows = await this.drizzleService.db
      .select()
      .from(packageHistories)
      .where(eq(packageHistories.packageId, packageId))
      .orderBy(asc(packageHistories.createdAt));

    if (!rows.length) return null;

    return rows.map(DrizzlePackageHistoryMapper.toDomain);
  }
}
