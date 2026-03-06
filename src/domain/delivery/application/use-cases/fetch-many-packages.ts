import { type Either, left, right } from '@/core/either';
import type { Pagination } from '@/core/entities/value-object/pagination';
import type { Package } from '../../enterprise/entities/package';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type {
  FindManyPackagesParams,
  PackagesRepository,
} from '../repositories/packages-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface FetchManyPackagesUseCaseRequest {
  authorId: string;
  search?: string;
  name?: string;
  code?: string;
  recipientAddress?: string;
  status?: string;
  postalCode?: string;
  deliveredAtGte?: Date;
  page?: number;
  perPage?: number;
  order?: FindManyPackagesParams['order'];
  createdAtGte?: Date;
  updatedAtGte?: Date;
}

type FetchManyPackagesUseCaseResponse = Either<
  OnlyAdminCanPerformThisActionError,
  { packages: Pagination<Package> }
>;

export class FetchManyPackagesUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    authorId,
    ...params
  }: FetchManyPackagesUseCaseRequest): Promise<FetchManyPackagesUseCaseResponse> {
    const adminPerson = await this.adminPeopleRepository.findById(authorId);

    if (!adminPerson) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    const packages = await this.packagesRepository.findManyPackages(params);

    return right({ packages });
  }
}
