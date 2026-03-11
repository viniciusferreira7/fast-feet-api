import { type Either, left, right } from '@/core/either';
import { Package } from '../../enterprise/entities/package';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface AssignPackageToADeliveryPersonUseCaseRequest {
  packageId: string;
  deliveryPersonId: string;
  authorId: string;
  description?: string | null;
}

type AssignPackageToADeliveryPersonUseCaseResponse = Either<
  ResourceNotFoundError | InvalidatePackageStatusError,
  {
    package: Package;
  }
>;

export class AssignPackageToADeliveryPerson {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    packageId,
    authorId,
    deliveryPersonId,
    description,
  }: AssignPackageToADeliveryPersonUseCaseRequest): Promise<AssignPackageToADeliveryPersonUseCaseResponse> {
    const [author, deliveryPerson, packageRegistered] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),
      this.deliveryPeopleRepository.findById(deliveryPersonId),
      this.packagesRepository.findById(packageId),
    ]);

    if (!author) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (!deliveryPerson) {
      return left(new ResourceNotFoundError('delivery'));
    }

    if (!packageRegistered) {
      return left(new ResourceNotFoundError('package'));
    }

    packageRegistered.assignDeliveryPerson(
      deliveryPerson.id,
      author.id,
      description
    );

    await this.packagesRepository.update(packageRegistered);

    return right({ package: packageRegistered });
  }
}
