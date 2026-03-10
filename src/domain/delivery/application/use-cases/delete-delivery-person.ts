import { type Either, left, right } from '@/core/either';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { DeliveryPersonAlreadyDisabledError } from '../../errors/delivery-person-already-disabled-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { CannotDisableDeliveryPersonWithActivePackagesError } from './errors/cannot-disable-delivery-person-with-active-packages-error';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface DeleteDeliveryPersonUseCaseRequest {
  authorId: string;
  cpf: string;
}

type DeleteDeliveryPersonUseCaseResponse = Either<
  | ResourceNotFoundError
  | OnlyAdminCanPerformThisActionError
  | DeliveryPersonAlreadyDisabledError
  | CannotDisableDeliveryPersonWithActivePackagesError,
  { deliveryPerson: DeliveryPerson }
>;

export class DeleteDeliveryPersonUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly packageRepository: PackagesRepository,
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

    const packageRecords = await this.packageRepository.findByDeliveryPersonId(
      deliveryPerson.id.toString(),
      [
        'awaiting_pickup',
        'picked_up',
        'at_distribution_center',
        'in_transit',
        'out_for_delivery',
        'failed_delivery',
      ]
    );

    if (packageRecords.length > 0) {
      return left(new CannotDisableDeliveryPersonWithActivePackagesError());
    }

    const deliveryPersonAlreadyDisabled = deliveryPerson.disableProfile();

    if (deliveryPersonAlreadyDisabled.isLeft()) {
      return left(new DeliveryPersonAlreadyDisabledError());
    }

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson });
  }
}
