import { type Either, left, right } from '@/core/either';
import type { AdminPerson } from '../../enterprise/entities/admin-person';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import type { HashComparer } from '../cryptography/hash-comparer';
import type { HashGenerator } from '../cryptography/hash-generator';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { PasswordValidator } from '../validation/password-validator';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

interface ResetAdminPersonPasswordUseCaseRequest {
  email: string;
  password: string;
  newPassword: string;
}

type ResetAdminPersonPasswordUseCaseResponse = Either<
  | WrongCredentialsError
  | EmailCodeHasNotBeenVerifiedError
  | ExternalPasswordValidationError,
  { adminPerson: AdminPerson }
>;

export class ResetAdminPersonPassword {
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

    const isPasswordValid = await this.passwordValidator.validate(newPassword);

    if (!isPasswordValid) {
      return left(new ExternalPasswordValidationError());
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
