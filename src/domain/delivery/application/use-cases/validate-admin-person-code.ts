import { type Either, left, right } from '@/core/either';
import type { AdminPerson } from '../../enterprise/entities/admin-person';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface ValidateAdminPersonCodeUseCaseRequest {
  code: string;
  email: string;
}

type ValidateAdminPersonCodeUseCaseResponse = Either<
  | ResourceNotFoundError
  | EmailCodeExpiredError
  | InvalidEmailCodeError
  | EmailCodeHasNotBeenVerifiedError,
  { adminPerson: AdminPerson }
>;

export class ValidateAdminPersonCodeUseCase {
  constructor(private readonly adminPeopleRepository: AdminPeopleRepository) {}

  async execute({
    code,
    email,
  }: ValidateAdminPersonCodeUseCaseRequest): Promise<ValidateAdminPersonCodeUseCaseResponse> {
    const adminPerson = await this.adminPeopleRepository.findByEmail(email);

    if (!adminPerson) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (adminPerson.emailVerification?.isCodeExpired()) {
      return left(new EmailCodeExpiredError());
    }

    if (!adminPerson.emailVerification?.validateCode(code)) {
      return left(new InvalidEmailCodeError());
    }

    if (!adminPerson.isEmailValidated) {
      return left(new EmailCodeHasNotBeenVerifiedError());
    }

    await this.adminPeopleRepository.update(adminPerson);

    return right({ adminPerson });
  }
}
