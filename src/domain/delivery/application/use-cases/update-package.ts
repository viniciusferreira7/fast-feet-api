import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface UpdatePackageUseCaseRequest {
  name: string;
  recipientAddress: string;
  authorId: string;
  packageId: string;
  description?: string;
}

type UpdatePackageUseCaseResponse = Either<
  ResourceNotFoundError | OnlyAdminCanPerformThisActionError,
  {
    package: Package;
  }
>;

@Injectable()
export class UpdatePackage {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    name,
    authorId,
    recipientAddress,
    packageId,
    description,
  }: UpdatePackageUseCaseRequest): Promise<UpdatePackageUseCaseResponse> {
    const [author, packageRecord] = await Promise.all([
      this.adminPeopleRepository.findById(authorId),

      this.packagesRepository.findById(packageId),
    ]);

    if (!author) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    if (!packageRecord) {
      return left(new ResourceNotFoundError('package'));
    }

    packageRecord.update(
      {
        name,
        recipientAddress,
      },
      description
    );

    await this.packagesRepository.update(packageRecord);

    return right({ package: packageRecord });
  }
}
