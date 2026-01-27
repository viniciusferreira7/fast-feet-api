import { type Either, left, right } from '@/core/either';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Package } from '../../enterprise/entities/package';
import { PackageCode } from '../../enterprise/entities/value-object/package-code';
import { PackageHistoryList } from '../../enterprise/entities/value-object/package-history-list';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { PostCode } from '../../enterprise/entities/value-object/post-code';
import { ExternalPostCodeError } from '../../errors/external-post-code-validation-error';
import type { InvalidaPostCode } from '../../errors/invalid-post-code-error';
import type { InvalidatePackageCodeError } from '../../errors/invalidate-package-code-error';
import type { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import type { PostCodeValidator } from '../validation/post-code-validator';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface RegisterPackageUseCaseRequest {
  recipientId: string;
  name: string;
  recipientAddress: string;
  postCode: string;
  deliveryPersonId: string | null;
  authorId: string;
}

type RegisterPackageUseCaseResponse = Either<
  | ResourceNotFoundError
  | InvalidatePackageCodeError
  | InvalidatePackageStatusError
  | InvalidaPostCode
  | ExternalPostCodeError,
  {
    package: Package;
  }
>;

export class RegisterPackage {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly postCodeValidator: PostCodeValidator
  ) {}

  async execute({
    recipientId,
    name,
    authorId,
    deliveryPersonId,
    recipientAddress,
    postCode,
  }: RegisterPackageUseCaseRequest): Promise<RegisterPackageUseCaseResponse> {
    const [author, deliveryPerson, recipientPerson, isPostCodeValid] =
      await Promise.all([
        this.adminPeopleRepository.findById(authorId),
        deliveryPersonId
          ? this.deliveryPeopleRepository.findById(deliveryPersonId)
          : Promise.resolve(null),
        this.recipientPeopleRepository.findById(recipientId),
        this.postCodeValidator.validate(postCode),
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

    if (!isPostCodeValid) {
      return left(new ExternalPostCodeError());
    }

    const packageCode = PackageCode.create();

    if (packageCode.isLeft()) {
      return left(packageCode.value);
    }

    const packageStatus = PackageStatus.create('pending');

    if (packageStatus.isLeft()) {
      return left(packageStatus.value);
    }

    const postCodeResult = PostCode.create({ value: postCode });

    if (postCodeResult.isLeft()) {
      return left(postCodeResult.value);
    }

    const packageCreatedResult = Package.create({
      id: new UniqueEntityId(),
      name: name,
      recipientId: recipientPerson.id,
      recipientAddress,
      status: packageStatus.value,
      code: packageCode.value,
      postalCode: postCodeResult.value,
      deliveryPersonId: deliveryPerson?.id ?? null,
      authorId: author.id,
      histories: new PackageHistoryList(),
    });

    if (packageCreatedResult.isLeft()) {
      return left(packageCreatedResult.value);
    }

    const packageCreated = packageCreatedResult.value;

    packageCreated.markAsRegistered(author.id);

    await this.packagesRepository.register(packageCreated);

    return right({ package: packageCreated });
  }
}
