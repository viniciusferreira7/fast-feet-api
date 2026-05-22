import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { EmailSender } from '../email/email-sender';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';

interface UpdateRecipientPersonUseCaseRequest {
  id: string;
  name?: string;
  email?: string;
}

type UpdateRecipientPersonUseCaseResponse = Either<
  ResourceNotFoundError | EmailAlreadyInUseError,
  { recipientPerson: RecipientPerson }
>;

@Injectable()
export class UpdateRecipientPersonUseCase {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly emailSender: EmailSender
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

      const codeWasCreated = recipientPerson.createNewEmailVerification();

      if (codeWasCreated && recipientPerson.emailVerification) {
        await this.emailSender.send(
          'Fast Feet sent a code confirmation',
          `Your new code is ${recipientPerson.emailVerification.code}`,
          recipientPerson.email
        );
      }
    }

    if (name) {
      recipientPerson.updateName(name);
    }

    await this.recipientPeopleRepository.update(recipientPerson);

    return right({ recipientPerson });
  }
}
