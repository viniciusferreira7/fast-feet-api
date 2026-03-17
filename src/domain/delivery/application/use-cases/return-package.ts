import { type Either, left, right } from '@/core/either';
import type { Package } from '../../enterprise/entities/package';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { DeliveryPersonNotAssignedToPackageError } from './errors/delivery-person-not-assigned-to-package-error';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface ReturnPackageUseCaseRequest {
  deliveryPersonId: string;
  packageId: string;
  description?: string;
}

type ReturnPackageUseCaseResponse = Either<
  | ResourceNotFoundError
  | PackageNotAssignedToDeliveryPersonError
  | DeliveryPersonNotAssignedToPackageError
  | InvalidatePackageStatusError,
  { package: Package }
>;

export class ReturnPackageUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository
  ) {}

  async execute({
    deliveryPersonId,
    packageId,
    description,
  }: ReturnPackageUseCaseRequest): Promise<ReturnPackageUseCaseResponse> {
    const [packageRecord, deliveryPersonRecord] = await Promise.all([
      this.packagesRepository.findById(packageId),
      this.deliveryPeopleRepository.findById(deliveryPersonId),
    ]);

    if (!packageRecord) {
      return left(new ResourceNotFoundError('package'));
    }

    if (!deliveryPersonRecord) {
      return left(new ResourceNotFoundError('delivery person'));
    }

    const transitionResult = packageRecord.markAsReturned(
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
