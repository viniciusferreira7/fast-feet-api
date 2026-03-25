import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { Package } from '../../enterprise/entities/package';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { PackageAlreadyCanceledErrorError } from './errors/package-already-canceled-error';

interface CancelPackageUseCaseRequest {
  authorId: string;
  packageId: string;
  description?: string;
}

type CancelPackageUseCaseResponse = Either<
  | ResourceNotFoundError
  | OnlyAdminCanPerformThisActionError
  | PackageAlreadyCanceledErrorError
  | InvalidatePackageStatusError,
  { package: Package }
>;

export class CancelPackageUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    authorId,
    packageId,
    description,
  }: CancelPackageUseCaseRequest): Promise<CancelPackageUseCaseResponse> {
    const [adminPerson, packageRegister] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),

      this.packagesRepository.findById(packageId),
    ]);

    if (!adminPerson) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    if (!packageRegister) {
      return left(new ResourceNotFoundError('package'));
    }

    const isPackageAlreadyCanceled = packageRegister.status.isCanceled();

    if (isPackageAlreadyCanceled) {
      return left(new PackageAlreadyCanceledErrorError());
    }

    const cancelPackageResult = packageRegister.markAsCanceled(
      adminPerson.id,
      description
    );

    if (cancelPackageResult.isLeft()) {
      return left(new InvalidatePackageStatusError());
    }

    await this.packagesRepository.update(packageRegister);

    return right({ package: packageRegister });
  }
}
