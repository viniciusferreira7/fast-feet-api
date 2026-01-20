import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  PackageHistory,
  type PackageHistoryProps,
} from '@/domain/delivery/enterprise/entities/package-history';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';

export function makePackageHistory(
  override: Partial<PackageHistoryProps> = {},
  id?: UniqueEntityId
) {
  const toStatusResult = PackageStatus.create('pending');

  if (toStatusResult.isLeft()) {
    throw new Error(
      `Failed to create valid package status for package history factory: ${toStatusResult.value.message}`
    );
  }

  const packageHistory = PackageHistory.create(
    {
      packageId: new UniqueEntityId(),
      fromStatus: null,
      toStatus: toStatusResult.value,
      authorId: new UniqueEntityId(),
      deliveryPersonId: null,
      description: faker.lorem.sentence(),
      createdAt: new Date(),
      ...override,
    },
    id
  );

  return packageHistory;
}
