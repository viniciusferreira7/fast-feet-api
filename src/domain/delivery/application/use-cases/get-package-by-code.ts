import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { PackageDetails } from '../../enterprise/entities/value-object/package-details';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface GetByPackageByCodeUseCaseRequest {
  authorId: string;
  packageId: string;
}

type GetByPackageByCodeUseCaseResponse = Either<
  ResourceNotFoundError | OnlyAdminCanPerformThisActionError,
  { package: PackageDetails }
>;

export class GetByPackageByCodeUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    authorId,
    packageId,
  }: GetByPackageByCodeUseCaseRequest): Promise<GetByPackageByCodeUseCaseResponse> {
    const [adminPerson, packageDetails] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),
      this.packagesRepository.findDetailsByCode(packageId),
    ]);

    if (!adminPerson) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    if (!packageDetails) {
      return left(new ResourceNotFoundError('package'));
    }

    return right({ package: packageDetails });
  }
}
