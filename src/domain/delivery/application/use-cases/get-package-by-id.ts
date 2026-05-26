import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { PackageDetails } from '../../enterprise/entities/value-object/package-details';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface GetByPackageByIdUseCaseRequest {
  authorId: string;
  packageId: string;
}

type GetByPackageByIdUseCaseResponse = Either<
  ResourceNotFoundError | OnlyAdminCanPerformThisActionError,
  { package: PackageDetails }
>;

@Injectable()
export class GetByPackageByIdUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    authorId,
    packageId,
  }: GetByPackageByIdUseCaseRequest): Promise<GetByPackageByIdUseCaseResponse> {
    const [adminPerson, packageDetails] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),
      this.packagesRepository.findDetailsById(packageId),
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
