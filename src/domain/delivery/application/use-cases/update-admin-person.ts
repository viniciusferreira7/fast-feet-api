import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { AdminPerson } from '../../enterprise/entities/admin-person';
import { EmailSender } from '../email/email-sender';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';

interface UpdateAdminPersonUseCaseRequest {
  id: string;
  name?: string;
  email?: string;
}

type UpdateAdminPersonUseCaseResponse = Either<
  ResourceNotFoundError | EmailAlreadyInUseError,
  { adminPerson: AdminPerson }
>;

@Injectable()
export class UpdateAdminPersonUseCase {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly emailSender: EmailSender
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

      const codeWasCreated = adminPerson.createNewEmailVerification();

      if (codeWasCreated && adminPerson.emailVerification) {
        await this.emailSender.send(
          'Fast Feet sent a code confirmation',
          `Your new code is ${adminPerson.emailVerification.code}`,
          adminPerson.email
        );
      }
    }

    if (name) {
      adminPerson.updateName(name);
    }

    await this.adminPeopleRepository.update(adminPerson);

    return right({ adminPerson });
  }
}
