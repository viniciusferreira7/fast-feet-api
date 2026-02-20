import { type Either, left, right } from '@/core/either';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { DeliveryPersonAlreadyDisabledError } from '../../errors/delivery-person-already-disabled-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface DeleteDeliveryPersonUseCaseRequest {
  authorId: string;
  cpf: string;
}

type DeleteDeliveryPersonUseCaseResponse = Either<
  | ResourceNotFoundError
  | OnlyAdminCanPerformThisActionError
  | DeliveryPersonAlreadyDisabledError,
  { deliveryPerson: DeliveryPerson }
>;

export class DeleteDeliveryPersonUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    authorId,
    cpf,
  }: DeleteDeliveryPersonUseCaseRequest): Promise<DeleteDeliveryPersonUseCaseResponse> {
    const [deliveryPerson, adminPerson] = await Promise.all([
      this.deliveryPeopleRepository.findByCpf(cpf),
      this.adminPeopleRepository.findById(authorId),
    ]);

    if (!deliveryPerson) {
      return left(new ResourceNotFoundError(cpf));
    }

    if (!adminPerson) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    const deliveryPersonAlreadyDisabled = deliveryPerson.disableProfile();

    if (deliveryPersonAlreadyDisabled.isLeft()) {
      return left(new DeliveryPersonAlreadyDisabledError());
    }

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson });
  }
}
