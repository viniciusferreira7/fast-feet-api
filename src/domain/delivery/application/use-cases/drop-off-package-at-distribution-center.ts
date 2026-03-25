import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { DeliveryPersonNotAssignedToPackageError } from './errors/delivery-person-not-assigned-to-package-error';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';

interface DropOffPackageAtDistributionCenterUseCaseRequest {
  deliveryPersonId: string;
  packageId: string;
  description?: string;
}

type DropOffPackageAtDistributionCenterUseCaseResponse = Either<
  | ResourceNotFoundError
  | PackageNotAssignedToDeliveryPersonError
  | DeliveryPersonNotAssignedToPackageError
  | InvalidatePackageStatusError,
  { package: Package }
>;

export class DropOffPackageAtDistributionCenterUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository
  ) {}

  async execute({
    deliveryPersonId,
    packageId,
    description,
  }: DropOffPackageAtDistributionCenterUseCaseRequest): Promise<DropOffPackageAtDistributionCenterUseCaseResponse> {
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

    const transitionResult = packageRecord.markAtDistributionCenter(
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
