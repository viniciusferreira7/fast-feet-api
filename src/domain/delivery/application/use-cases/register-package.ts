import { type Either, left, right } from '@/core/either';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Package } from '../../enterprise/entities/package';
import { PackageCode } from '../../enterprise/entities/value-object/package-code';
import { PackageHistoryList } from '../../enterprise/entities/value-object/package-history-list';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import type { InvalidatePackageCodeError } from '../../errors/invalidate-package-code-error';
import type { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface RegisterPackageUseCaseRequest {
  recipientId: string;
  name: string;
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
    private readonly packagesRepository: PackagesRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly recipientPeopleRepository: RecipientPeopleRepository
  ) {}

  async execute({
    recipientId,
    name,
    authorId,
    deliveryPersonId,
    recipientAddress,
  }: RegisterPackageUseCaseRequest): Promise<RegisterPackageUseCaseResponse> {
    const [author, deliveryPerson, recipientPerson] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),
      deliveryPersonId
        ? this.deliveryPeopleRepository.findById(deliveryPersonId)
        : Promise.resolve(null),
      this.recipientPeopleRepository.findById(recipientId),
    ]);

    if (!author) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (!deliveryPerson && deliveryPersonId) {
      return left(new ResourceNotFoundError('delivery'));
    }

    if (!recipientPerson) {
      return left(new ResourceNotFoundError('recipient'));
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
      name: name,
      recipientId: recipientPerson.id,
      recipientAddress,
      status: packageStatus.value,
      code: packageCode.value,
      deliveryPersonId: deliveryPerson?.id ?? null,
      authorId: author.id,
      histories: new PackageHistoryList(),
    });

    await this.packagesRepository.register(packageCreated);

    return right({ package: packageCreated });
  }
}
