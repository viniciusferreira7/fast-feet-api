import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { EmailSender } from '../email/email-sender';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';

interface UpdateDeliveryPersonUseCaseRequest {
  id: string;
  name?: string;
  email?: string;
}

type UpdateDeliveryPersonUseCaseResponse = Either<
  | ResourceNotFoundError
  | EmailAlreadyInUseError
  | DeliveryPersonProfileIsDisableError,
  { deliveryPerson: DeliveryPerson }
>;

@Injectable()
export class UpdateDeliveryPersonUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly emailSender: EmailSender
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

    if (!deliveryPerson?.isActive) {
      return left(new DeliveryPersonProfileIsDisableError());
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

      const codeWasCreated = deliveryPerson.createNewEmailVerification();

      if (codeWasCreated && deliveryPerson.emailVerification) {
        await this.emailSender.send(
          'Fast Feet sent a code confirmation',
          `Your new code is ${deliveryPerson.emailVerification.code}`,
          deliveryPerson.email
        );
      }
    }

    if (name) {
      deliveryPerson.updateName(name);
    }

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson });
  }
}
