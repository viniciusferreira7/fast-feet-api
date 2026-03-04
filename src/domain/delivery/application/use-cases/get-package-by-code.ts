import { type Either, left, right } from '@/core/either';
import type { Package } from '../../enterprise/entities/package';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface GetByPackageByCodeUseCaseRequest {
  authorId: string;
  packageId: string;
}

type GetByPackageByCodeUseCaseResponse = Either<
  ResourceNotFoundError | OnlyAdminCanPerformThisActionError,
  { package: Package }
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
    const [adminPerson, packageRegister] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),
      this.packagesRepository.findByCode(packageId),
    ]);

    if (!adminPerson) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    if (!packageRegister) {
      return left(new ResourceNotFoundError());
    }

    return right({ package: packageRegister });
  }
}
