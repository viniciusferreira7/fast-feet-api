import { type Either, left, right } from '@/core/either';
import type { AdminPerson } from '../../enterprise/entities/admin-person';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface UpdateAdminPersonUseCaseRequest {
  id: string;
  name?: string;
  email?: string;
}

type UpdateAdminPersonUseCaseResponse = Either<
  ResourceNotFoundError | EmailAlreadyInUseError,
  { adminPerson: AdminPerson }
>;

export class UpdateAdminPersonUseCase {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly recipientPeopleRepository: RecipientPeopleRepository
  ) {}

  async execute({
    id,
    name,
    email,
  }: UpdateAdminPersonUseCaseRequest): Promise<UpdateAdminPersonUseCaseResponse> {
    const adminPerson = await this.adminPeopleRepository.findById(id);

    if (!adminPerson) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (email) {
      const [
        adminPersonWithSame,
        deliveryPersonWithSame,
        recipientPersonWithSame,
      ] = await Promise.all([
        this.adminPeopleRepository.findByEmail(email),
        this.deliveryPeopleRepository.findByEmail(email),
        this.recipientPeopleRepository.findByEmail(email),
      ]);

      if (
        adminPersonWithSame ||
        deliveryPersonWithSame ||
        recipientPersonWithSame
      ) {
        return left(new EmailAlreadyInUseError());
      }

      adminPerson.updateEmail(email);
    }

    if (name) {
      adminPerson.updateName(name);
    }

    await this.adminPeopleRepository.update(adminPerson);

    return right({ adminPerson });
  }
}
