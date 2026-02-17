import { type Either, left, right } from '@/core/either';
import type { RecipientPerson } from '../../enterprise/entities/recipient-person';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface UpdateRecipientPersonUseCaseRequest {
  id: string;
  name?: string;
  email?: string;
}

type UpdateRecipientPersonUseCaseResponse = Either<
  ResourceNotFoundError | EmailAlreadyInUseError,
  { recipientPerson: RecipientPerson }
>;

export class UpdateRecipientPersonUseCase {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository
  ) {}

  async execute({
    id,
    name,
    email,
  }: UpdateRecipientPersonUseCaseRequest): Promise<UpdateRecipientPersonUseCaseResponse> {
    const recipientPerson = await this.recipientPeopleRepository.findById(id);

    if (!recipientPerson) {
      return left(new ResourceNotFoundError('recipient'));
    }

    if (email) {
      const [
        recipientPersonWithSame,
        adminPersonWithSame,
        deliveryPersonWithSame,
      ] = await Promise.all([
        this.recipientPeopleRepository.findByEmail(email),
        this.adminPeopleRepository.findByEmail(email),
        this.deliveryPeopleRepository.findByEmail(email),
      ]);

      if (
        recipientPersonWithSame ||
        adminPersonWithSame ||
        deliveryPersonWithSame
      ) {
        return left(new EmailAlreadyInUseError());
      }

      recipientPerson.updateEmail(email);
    }

    if (name) {
      recipientPerson.updateName(name);
    }

    await this.recipientPeopleRepository.update(recipientPerson);

    return right({ recipientPerson });
  }
}
