import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { PackageDetails } from '../../enterprise/entities/value-object/package-details';
import { PackagesRepository } from '../repositories/packages-repository';

interface GetByPackageByCodeUseCaseRequest {
  packageCode: string;
}

type GetByPackageByCodeUseCaseResponse = Either<
  ResourceNotFoundError,
  { package: PackageDetails }
>;

@Injectable()
export class GetByPackageByCodeUseCase {
  constructor(private readonly packagesRepository: PackagesRepository) {}

  async execute({
    packageCode,
  }: GetByPackageByCodeUseCaseRequest): Promise<GetByPackageByCodeUseCaseResponse> {
    const packageDetails =
      await this.packagesRepository.findDetailsByCode(packageCode);

    if (!packageDetails) {
      return left(new ResourceNotFoundError('package'));
    }

    return right({ package: packageDetails });
  }
}
