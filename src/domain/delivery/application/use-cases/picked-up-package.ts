import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { PackageAlreadyAssignedError } from './errors/package-already-assined-erro';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';

interface PickUpPackageUseCaseRequest {
  packageId: string;
  deliveryPersonId: string;
  description?: string;
}

type PickUpPackageUseCaseResponse = Either<
  | ResourceNotFoundError
  | PackageNotAssignedToDeliveryPersonError
  | PackageAlreadyAssignedError
  | InvalidatePackageStatusError,
  { package: Package }
>;

export class PickUpPackageUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository
  ) {}

  async execute({
    packageId,
    deliveryPersonId,
    description,
  }: PickUpPackageUseCaseRequest): Promise<PickUpPackageUseCaseResponse> {
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

    const transitionResult = packageRecord.markAsPickedUp(
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
