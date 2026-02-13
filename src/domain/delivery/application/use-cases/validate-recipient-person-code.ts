import { type Either, left, right } from '@/core/either';
import type { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface ValidateRecipientPersonCodeUseCaseRequest {
  code: string;
  email: string;
}

type ValidateRecipientPersonCodeUseCaseResponse = Either<
  | ResourceNotFoundError
  | EmailCodeExpiredError
  | InvalidEmailCodeError
  | EmailCodeHasNotBeenVerifiedError,
  { recipientPerson: RecipientPerson }
>;

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

    if (!recipientPerson.isEmailValidated) {
      return left(new EmailCodeHasNotBeenVerifiedError());
    }

    await this.recipientPeopleRepository.update(recipientPerson);

    return right({ recipientPerson });
  }
}
