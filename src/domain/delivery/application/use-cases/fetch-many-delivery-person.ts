import { type Either, left, right } from '@/core/either';
import type { Pagination } from '@/core/entities/value-object/pagination';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type {
  DeliveryPeopleRepository,
  FindManyDeliveryPersonParams,
} from '../repositories/delivery-people-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface FetchManyDeliveryPersonUseCaseRequest {
  authorId: string;
  search?: string;
  page?: number;
  perPage?: number;
  order?: FindManyDeliveryPersonParams['order'];
  createdAtGte?: Date;
  updatedAtGte?: Date;
}

type FetchManyDeliveryPersonUseCaseResponse = Either<
  OnlyAdminCanPerformThisActionError,
  { deliveryPeople: Pagination<DeliveryPerson> }
>;

export class FetchManyDeliveryPersonUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    authorId,
    ...params
  }: FetchManyDeliveryPersonUseCaseRequest): Promise<FetchManyDeliveryPersonUseCaseResponse> {
    const adminPerson = await this.adminPeopleRepository.findById(authorId);

    if (!adminPerson) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    const deliveryPeople =
      await this.deliveryPeopleRepository.findManyDeliveryPerson(params);

    return right({ deliveryPeople });
  }
}
