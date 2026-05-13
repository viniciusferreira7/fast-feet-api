import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import type { AdminPerson } from '../../enterprise/entities/admin-person';
import { WeakPasswordError } from '../../errors/weak-password-error';
import { HashComparer } from '../cryptography/hash-comparer';
import { HashGenerator } from '../cryptography/hash-generator';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { PasswordValidator } from '../validation/password-validator';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

interface ResetAdminPersonPasswordUseCaseRequest {
  email: string;
  password: string;
  newPassword: string;
}

type ResetAdminPersonPasswordUseCaseResponse = Either<
  WrongCredentialsError | EmailCodeHasNotBeenVerifiedError | WeakPasswordError,
  { adminPerson: AdminPerson }
>;

@Injectable()
export class ResetAdminPersonPasswordUseCase {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly passwordValidator: PasswordValidator,
    private readonly hashGenerator: HashGenerator,
    private readonly hashComparer: HashComparer
  ) {}

  async execute({
    email,
    password,
    newPassword,
  }: ResetAdminPersonPasswordUseCaseRequest): Promise<ResetAdminPersonPasswordUseCaseResponse> {
    const adminPerson = await this.adminPeopleRepository.findByEmail(email);

    if (!adminPerson) {
      return left(new WrongCredentialsError());
    }

    const doesPasswordMatches = await this.hashComparer.compare(
      password,
      adminPerson.password
    );

    if (!doesPasswordMatches) {
      return left(new WrongCredentialsError());
    }

    const hasTheEmailBeenVerified = adminPerson.isEmailValidated;

    if (!hasTheEmailBeenVerified) {
      return left(new EmailCodeHasNotBeenVerifiedError());
    }

    const passwordValidation = this.passwordValidator.validate(newPassword);

    if (passwordValidation.isLeft()) {
      return left(passwordValidation.value);
    }

    const newPasswordHashed = await this.hashGenerator.hash(newPassword);

    const passwordUpdatedResult = adminPerson.updatePassword(newPasswordHashed);

    if (passwordUpdatedResult.isLeft()) {
      return left(passwordUpdatedResult.value);
    }

    await this.adminPeopleRepository.update(adminPerson);

    return right({ adminPerson });
  }
}
