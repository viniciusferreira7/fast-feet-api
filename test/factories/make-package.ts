import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  Package,
  type PackageProps,
} from '@/domain/delivery/enterprise/entities/package';
import { PackageCode } from '@/domain/delivery/enterprise/entities/value-object/package-code';
import { PackageHistoryList } from '@/domain/delivery/enterprise/entities/value-object/package-history-list';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import { PostCode } from '@/domain/delivery/enterprise/entities/value-object/post-code';
import { makePackageHistory } from './make-package-history';

export function makePackage(
  override: Partial<PackageProps> = {},
  id?: UniqueEntityId
) {
  const packageCodeResult = PackageCode.create();

  if (packageCodeResult.isLeft()) {
    throw new Error(
      `Failed to generate valid package code for package factory: ${packageCodeResult.value.message}`
    );
  }

  const statusResult = PackageStatus.create('pending');

  if (statusResult.isLeft()) {
    throw new Error(
      `Failed to create valid package status for package factory: ${statusResult.value.message}`
    );
  }

  const postCodeResult = PostCode.create({ value: '12345-678' });

  if (postCodeResult.isLeft()) {
    throw new Error(
      `Failed to create valid post code for package factory: ${postCodeResult.value.message}`
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

  const packageEntityResult = Package.create(
    {
      id: packageId,
      name: faker.lorem.words({ min: 3, max: 20 }),
      code: packageCodeResult.value,
      recipientId: new UniqueEntityId(),
      authorId,
      recipientAddress: faker.location.streetAddress({ useFullAddress: true }),
      status: statusResult.value,
      postalCode: postCodeResult.value,
      attachment: null,
      histories: new PackageHistoryList([initialHistory]),
      deliveryPersonId: new UniqueEntityId(),
      ...override,
    },
    id
  );

  if (packageEntityResult.isLeft()) {
    throw new Error(
      `Failed to create package entity: ${packageEntityResult.value.message}`
    );
  }

  return packageEntityResult.value;
}
