import { type Either, left, right } from '@/core/either';
import type { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import type { HashComparer } from '../cryptography/hash-comparer';
import type { HashGenerator } from '../cryptography/hash-generator';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import type { PasswordValidator } from '../validation/password-validator';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

interface ResetRecipientPersonPasswordUseCaseRequest {
  email: string;
  password: string;
  newPassword: string;
}

type ResetRecipientPersonPasswordUseCaseResponse = Either<
  | WrongCredentialsError
  | EmailCodeHasNotBeenVerifiedError
  | ExternalPasswordValidationError,
  { recipientPerson: RecipientPerson }
>;

export class ResetRecipientPersonPassword {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly passwordValidator: PasswordValidator,
    private readonly hashGenerator: HashGenerator,
    private readonly hashComparer: HashComparer
  ) {}

  async execute({
    email,
    password,
    newPassword,
  }: ResetRecipientPersonPasswordUseCaseRequest): Promise<ResetRecipientPersonPasswordUseCaseResponse> {
    const recipientPerson =
      await this.recipientPeopleRepository.findByEmail(email);

    if (!recipientPerson) {
      return left(new WrongCredentialsError());
    }

    const doesPasswordMatches = await this.hashComparer.compare(
      password,
      recipientPerson.password
    );

    if (!doesPasswordMatches) {
      return left(new WrongCredentialsError());
    }

    const hasTheEmailBeenVerified = recipientPerson.isEmailValidated;

    if (!hasTheEmailBeenVerified) {
      return left(new EmailCodeHasNotBeenVerifiedError());
    }

    const isPasswordValid = await this.passwordValidator.validate(newPassword);

    if (!isPasswordValid) {
      return left(new ExternalPasswordValidationError());
    }

    const newPasswordHashed = await this.hashGenerator.hash(newPassword);

    const passwordUpdatedResult =
      recipientPerson.updatePassword(newPasswordHashed);

    if (passwordUpdatedResult.isLeft()) {
      return left(passwordUpdatedResult.value);
    }

    await this.recipientPeopleRepository.update(recipientPerson);

    return right({ recipientPerson });
  }
}
