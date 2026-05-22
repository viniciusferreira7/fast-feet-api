import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import { RecipientPeopleRepository } from '../repositories/recipient-people-repository';

interface ValidateRecipientPersonCodeUseCaseRequest {
  code: string;
  email: string;
}

type ValidateRecipientPersonCodeUseCaseResponse = Either<
  ResourceNotFoundError | EmailCodeExpiredError | InvalidEmailCodeError,
  { recipientPerson: RecipientPerson }
>;

@Injectable()
export class ValidateRecipientPersonCodeUseCase {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository
  ) {}

  async execute({
    code,
    email,
  }: ValidateRecipientPersonCodeUseCaseRequest): Promise<ValidateRecipientPersonCodeUseCaseResponse> {
    const recipientPerson =
      await this.recipientPeopleRepository.findByEmail(email);

    if (!recipientPerson) {
      return left(new ResourceNotFoundError('recipient'));
    }

    if (recipientPerson.emailVerification?.isCodeExpired()) {
      return left(new EmailCodeExpiredError());
    }

    if (!recipientPerson.emailVerification?.validateCode(code)) {
      return left(new InvalidEmailCodeError());
    }

    recipientPerson.markEmailAsValidated();

    await this.recipientPeopleRepository.update(recipientPerson);

    return right({ recipientPerson });
  }
}
