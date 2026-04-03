import { type Either, left, right } from '@/core/either';
import type { Pagination } from '@/core/entities/value-object/pagination';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { Package } from '../../enterprise/entities/package';
import { PostalCode } from '../../enterprise/entities/value-object/postal-code';
import { ExternalPostalCodeError } from '../../errors/external-postal-code-validation-error';
import { InvalidPostalCode } from '../../errors/invalid-postal-code-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import type { PostalCodeValidator } from '../validation/postal-code-validator';

interface FetchPackagesNearByDeliveryPersonUseCaseRequest {
  authorId: string;
  deliveryPersonId: string;
  deliveryPersonPostalCodeLocation: string;
  page?: number;
  perPage?: number;
}

type FetchPackagesNearByDeliveryPersonUseCaseResponse = Either<
  ResourceNotFoundError | InvalidPostalCode | ExternalPostalCodeError,
  { packages: Pagination<Package> }
>;

export class FetchPackagesNearByDeliveryPersonUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly postalCodeValidator: PostalCodeValidator
  ) {}

  async execute({
    authorId,
    deliveryPersonId,
    deliveryPersonPostalCodeLocation,
    page,
    perPage,
  }: FetchPackagesNearByDeliveryPersonUseCaseRequest): Promise<FetchPackagesNearByDeliveryPersonUseCaseResponse> {
    const [author, deliveryPerson, deliveryPersonPostalCodeLocationValid] =
      await Promise.all([
        this.adminPeopleRepository.findById(authorId),
        this.deliveryPeopleRepository.findById(deliveryPersonId),
        this.postalCodeValidator.validate(deliveryPersonPostalCodeLocation),
      ]);

    if (!author) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (!deliveryPerson) {
      return left(new ResourceNotFoundError('delivery'));
    }

    if (deliveryPersonPostalCodeLocationValid.isLeft()) {
      return left(deliveryPersonPostalCodeLocationValid.value);
    }

    const postalCode = PostalCode.create({
      value: deliveryPersonPostalCodeLocation,
    });

    if (postalCode.isLeft()) {
      return left(postalCode.value);
    }

    const packages = await this.packagesRepository.findNearBy({
      postalCode: postalCode.value,
      page,
      perPage,
    });

    return right({ packages });
  }
}
