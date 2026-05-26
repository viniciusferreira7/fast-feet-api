import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface PackageIsOutForDeliveryUseCaseRequest {
  authorId: string;
  deliveryPersonId: string;
  packageId: string;
  description?: string;
}

type PackageIsOutForDeliveryUseCaseResponse = Either<
  | ResourceNotFoundError
  | InvalidatePackageStatusError
  | OnlyAdminCanPerformThisActionError,
  { package: Package }
>;

@Injectable()
export class PackageIsOutForDeliveryUseCase {
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
  }: PackageIsOutForDeliveryUseCaseRequest): Promise<PackageIsOutForDeliveryUseCaseResponse> {
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

    const transitionResult = packageRecord.markAsOutForDelivery(
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
