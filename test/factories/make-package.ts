import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  Package,
  type PackageProps,
} from '@/domain/delivery/enterprise/entities/package';
import { PackageCode } from '@/domain/delivery/enterprise/entities/value-object/package-code';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';

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

  const packageEntity = Package.create(
    {
      id: new UniqueEntityId(),
      code: packageCodeResult.value,
      recipientName: faker.person.fullName(),
      recipientAddress: faker.location.streetAddress({ useFullAddress: true }),
      status: statusResult.value,
      attachment: null,
      deliveryPersonId: new UniqueEntityId(),
      ...override,
    },
    id
  );

  return packageEntity;
}
