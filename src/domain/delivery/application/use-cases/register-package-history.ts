import { type Either, left, right } from '@/core/either';
import {
  PackageHistory,
  PackageHistoryProps,
} from '../../enterprise/entities/package-history';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackagesHistoryRepository } from '../repositories/packages-history-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface RegisterPackageHistoryUseCaseRequest {
  packageHistoryData: PackageHistoryProps;
}

type RegisterPackageHistoryUseCaseResponse = Either<
  ResourceNotFoundError,
  { packageHistory: PackageHistory }
>;

export class RegisterPackageHistoryUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly packagesHistoryRepository: PackagesHistoryRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository
  ) {}

  async execute({
    packageHistoryData,
  }: RegisterPackageHistoryUseCaseRequest): Promise<RegisterPackageHistoryUseCaseResponse> {
    const [author, deliveryPerson, packageRegistered] = await Promise.all([
      this.adminPeopleRepository.findById(
        packageHistoryData.authorId.toString()
      ),
      packageHistoryData?.deliveryPersonId
        ? this.deliveryPeopleRepository.findById(
            packageHistoryData.deliveryPersonId.toString()
          )
        : Promise.resolve(null),
      this.packagesRepository.findById(packageHistoryData.packageId.toString()),
    ]);

    if (!author) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (!deliveryPerson) {
      return left(new ResourceNotFoundError('delivery'));
    }

    if (!packageRegistered) {
      return left(new ResourceNotFoundError('package'));
    }

    const packageHistory = PackageHistory.create({
      packageId: packageHistoryData.packageId,
      authorId: packageHistoryData.authorId,
      createdAt: packageHistoryData.createdAt,
      deliveryPersonId: packageHistoryData.deliveryPersonId,
      description: packageHistoryData.description,
      fromStatus: packageHistoryData.fromStatus,
      toStatus: packageHistoryData.toStatus,
    });

    await this.packagesHistoryRepository.register(packageHistory);

    return right({ packageHistory });
  }
}
