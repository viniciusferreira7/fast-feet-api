import { type Either, left, right } from '@/core/either';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Package } from '../../enterprise/entities/package';
import { PackageHistory } from '../../enterprise/entities/package-history';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesHistoryRepository } from '../repositories/packages-history-repository';
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
    private readonly packagesHistoryRepository: PackagesHistoryRepository,
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

    const previousPackageStatus = PackageStatus.create(
      packageRegistered.status.value
    );

    if (previousPackageStatus.isLeft()) {
      return left(previousPackageStatus.value);
    }

    const newPackageStatus = PackageStatus.create('awaiting_pickup');

    if (newPackageStatus.isLeft()) {
      return left(newPackageStatus.value);
    }

    const updateStatusResult = packageRegistered.updateStatus(
      newPackageStatus.value,
      author.id
    );

    if (updateStatusResult.isLeft()) {
      return left(updateStatusResult.value);
    }

    packageRegistered.assignDeliveryPerson(
      deliveryPerson.id,
      author.id,
      previousPackageStatus.value
    );

    const newPackageHistory = PackageHistory.create({
      packageId: packageRegistered.id,
      authorId: new UniqueEntityId(authorId),
      deliveryPersonId: new UniqueEntityId(deliveryPersonId),
      description: description ?? null,
      fromStatus: previousPackageStatus.value,
      toStatus: newPackageStatus.value,
    });

    await this.packagesRepository.update(packageRegistered);

    await this.packagesHistoryRepository.register(newPackageHistory);

    return right({ package: packageRegistered });
  }
}
