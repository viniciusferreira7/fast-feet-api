import { type Either, left, right } from '@/core/either';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Package } from '../../enterprise/entities/package';
import { PackageCode } from '../../enterprise/entities/value-object/package-code';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import type { InvalidatePackageCodeError } from '../../errors/invalidate-package-code-error';
import type { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackageRepository } from '../repositories/package-repository';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface RegisterPackageUseCaseRequest {
  recipientName: string;
  recipientAddress: string;
  deliveryPersonId: string | null;
  authorId: string;
}

type RegisterPackageUseCaseResponse = Either<
  | ResourceNotFoundError
  | InvalidatePackageCodeError
  | InvalidatePackageStatusError,
  {
    package: Package;
  }
>;

export class RegisterPackage {
  constructor(
    private readonly packageRepository: PackageRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    authorId,
    deliveryPersonId,
    recipientAddress,
    recipientName,
  }: RegisterPackageUseCaseRequest): Promise<RegisterPackageUseCaseResponse> {
    const [author, deliveryPerson] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),
      deliveryPersonId
        ? this.deliveryPeopleRepository.findById(deliveryPersonId)
        : Promise.resolve(null),
    ]);

    if (!author) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (!deliveryPerson && deliveryPersonId) {
      return left(new ResourceNotFoundError('delivery'));
    }

    const packageCode = PackageCode.create();

    if (packageCode.isLeft()) {
      return left(packageCode.value);
    }

    const packageStatus = PackageStatus.create('pending');

    if (packageStatus.isLeft()) {
      return left(packageStatus.value);
    }

    const packageCreated = Package.create({
      id: new UniqueEntityId(),
      recipientName,
      recipientAddress,
      status: packageStatus.value,
      code: packageCode.value,
      deliveryPersonId: deliveryPerson?.id ?? null,
    });

    await this.packageRepository.register(packageCreated);

    return right({ package: packageCreated });
  }
}
