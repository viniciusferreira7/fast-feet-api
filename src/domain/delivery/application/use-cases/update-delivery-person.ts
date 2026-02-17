import { type Either, left, right } from '@/core/either';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface UpdateDeliveryPersonUseCaseRequest {
  id: string;
  name?: string;
  email?: string;
}

type UpdateDeliveryPersonUseCaseResponse = Either<
  ResourceNotFoundError | EmailAlreadyInUseError,
  { deliveryPerson: DeliveryPerson }
>;

export class UpdateDeliveryPersonUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly recipientPeopleRepository: RecipientPeopleRepository
  ) {}

  async execute({
    id,
    name,
    email,
  }: UpdateDeliveryPersonUseCaseRequest): Promise<UpdateDeliveryPersonUseCaseResponse> {
    const deliveryPerson = await this.deliveryPeopleRepository.findById(id);

    if (!deliveryPerson) {
      return left(new ResourceNotFoundError('delivery'));
    }

    if (email) {
      const [
        deliveryPersonWithSame,
        adminPersonWithSame,
        recipientPersonWithSame,
      ] = await Promise.all([
        this.deliveryPeopleRepository.findByEmail(email),
        this.adminPeopleRepository.findByEmail(email),
        this.recipientPeopleRepository.findByEmail(email),
      ]);

      if (
        deliveryPersonWithSame ||
        adminPersonWithSame ||
        recipientPersonWithSame
      ) {
        return left(new EmailAlreadyInUseError());
      }

      deliveryPerson.updateEmail(email);
    }

    if (name) {
      deliveryPerson.updateName(name);
    }

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson });
  }
}
