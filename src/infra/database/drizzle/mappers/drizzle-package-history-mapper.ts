import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { PackageHistory } from '@/domain/delivery/enterprise/entities/package-history';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import type { packageHistories } from '../schema';

type PackageHistoryRaw = InferSelectModel<typeof packageHistories>;

export class DrizzlePackageHistoryMapper {
  public static toPersistence(history: PackageHistory): PackageHistoryRaw {
    return {
      id: history.id.toString(),
      packageId: history.packageId.toString(),
      fromStatus: history.fromStatus?.value ?? null,
      toStatus: history.toStatus.value,
      authorId: history.authorId.toString(),
      deliveryPersonId: history.deliveryPersonId?.toString() ?? null,
      description: history.description,
      createdAt: history.createdAt,
      version: 1,
    };
  }

  public static toDomain(raw: PackageHistoryRaw): PackageHistory {
    const toStatus = PackageStatus.create(raw.toStatus);

    if (toStatus.isLeft()) {
      throw new Error(`Invalid toStatus in database: ${raw.toStatus}`);
    }

    let fromStatus: PackageStatus | null = null;

    if (raw.fromStatus) {
      const result = PackageStatus.create(raw.fromStatus);
      if (result.isRight()) fromStatus = result.value;
    }

    if (!raw.packageId) {
      throw new Error(`Package history ${raw.id} has no packageId in database`);
    }

    return PackageHistory.create(
      {
        packageId: new UniqueEntityId(raw.packageId),
        fromStatus,
        toStatus: toStatus.value,
        authorId: new UniqueEntityId(raw.authorId),
        deliveryPersonId: raw.deliveryPersonId
          ? new UniqueEntityId(raw.deliveryPersonId)
          : null,
        description: raw.description ?? null,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id)
    );
  }
}
