import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  Package,
  type PackageProps,
} from '@/domain/delivery/enterprise/entities/package';
import { PackageCode } from '@/domain/delivery/enterprise/entities/value-object/package-code';
import { PackageHistoryList } from '@/domain/delivery/enterprise/entities/value-object/package-history-list';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import { makePackageHistory } from './make-package-history';

export function makePackage(
  override: Partial<PackageProps> = {},
  id?: UniqueEntityId
) {
  const packageCodeResult = PackageCode.create();

  if (packageCodeResult.isLeft()) {
    throw new Error(
      'Failed to generate valid package code for package factory'
    );
  }

  const statusResult = PackageStatus.create('pending');

  if (statusResult.isLeft()) {
    throw new Error(
      'Failed to create valid package status for package factory'
    );
  }

  const packageId = id ?? new UniqueEntityId();
  const authorId = new UniqueEntityId();

  const initialHistory = makePackageHistory({
    packageId,
    fromStatus: null,
    toStatus: statusResult.value,
    authorId,
    description: 'Package registered',
  });

  const packageEntity = Package.create(
    {
      id: packageId,
      name: faker.lorem.words({ min: 3, max: 20 }),
      code: packageCodeResult.value,
      recipientId: new UniqueEntityId(),
      authorId,
      recipientAddress: faker.location.streetAddress({ useFullAddress: true }),
      status: statusResult.value,
      attachment: null,
      histories: new PackageHistoryList([initialHistory]),
      deliveryPersonId: new UniqueEntityId(),
      ...override,
    },
    id
  );

  return packageEntity;
}
