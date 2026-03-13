import { type Either, left, right } from '@/core/either';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface GetByIdDeliveryPersonUseCaseRequest {
  deliveryPersonId: string;
  authorId: string;
}

type GetByIdDeliveryPersonUseCaseResponse = Either<
  ResourceNotFoundError | OnlyAdminCanPerformThisActionError,
  { deliveryPerson: DeliveryPerson }
>;

export class GetByIdDeliveryPersonUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    deliveryPersonId,
    authorId,
  }: GetByIdDeliveryPersonUseCaseRequest): Promise<GetByIdDeliveryPersonUseCaseResponse> {
    const isSamePersonLookingForThisPerson = deliveryPersonId === authorId;

    const [deliveryPerson, author] = await Promise.all([
      this.deliveryPeopleRepository.findById(deliveryPersonId),
      !isSamePersonLookingForThisPerson
        ? this.adminPeopleRepository.findById(authorId)
        : Promise.resolve(null),
    ]);

    if (!deliveryPerson) {
      return left(new ResourceNotFoundError('delivery person'));
    }

    if (!isSamePersonLookingForThisPerson && !author) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    return right({ deliveryPerson });
  }
}
