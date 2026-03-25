import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { Package } from '../../enterprise/entities/package';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { DeliveryPersonNotAssignedToPackageError } from './errors/delivery-person-not-assigned-to-package-error';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface PackageIsInTransitUsaCaseRequest {
  authorId: string;
  deliveryPersonId: string;
  packageId: string;
  description?: string;
}

type PackageIsInTransitUsaCaseResponse = Either<
  | ResourceNotFoundError
  | DeliveryPersonNotAssignedToPackageError
  | OnlyAdminCanPerformThisActionError,
  { package: Package }
>;

export class PackageIsInTransitUsaCase {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly packagesRepository: PackagesRepository
  ) {}

  async execute({
    authorId,
    deliveryPersonId,
    packageId,
    description,
  }: PackageIsInTransitUsaCaseRequest): Promise<PackageIsInTransitUsaCaseResponse> {
    const [adminPersonRecord, deliveryPersonRecord, packageRecord] =
      await Promise.all([
        this.adminPeopleRepository.findById(authorId),
        this.deliveryPeopleRepository.findById(deliveryPersonId),
        this.packagesRepository.findById(packageId),
      ]);

    if (!adminPersonRecord) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    if (!deliveryPersonRecord) {
      return left(new ResourceNotFoundError('delivery person'));
    }

    if (!packageRecord) {
      return left(new ResourceNotFoundError('package'));
    }

    const transitionResult = packageRecord.markAsInTransit(
      adminPersonRecord.id,
      deliveryPersonRecord.id,
      description
    );

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    await this.packagesRepository.update(packageRecord);

    return right({ package: packageRecord });
  }
}
