import { type Either, left, right } from '@/core/either';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import type { HashComparer } from '../cryptography/hash-comparer';
import type { HashGenerator } from '../cryptography/hash-generator';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PasswordValidator } from '../validation/password-validator';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

interface ResetDeliveryPersonPasswordUseCaseRequest {
  email: string;
  password: string;
  newPassword: string;
}

type ResetDeliveryPersonPasswordUseCaseResponse = Either<
  | WrongCredentialsError
  | EmailCodeHasNotBeenVerifiedError
  | ExternalPasswordValidationError,
  { deliveryPerson: DeliveryPerson }
>;

export class ResetDeliveryPersonPassword {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly passwordValidator: PasswordValidator,
    private readonly hashGenerator: HashGenerator,
    private readonly hashComparer: HashComparer
  ) {}

  async execute({
    email,
    password,
    newPassword,
  }: ResetDeliveryPersonPasswordUseCaseRequest): Promise<ResetDeliveryPersonPasswordUseCaseResponse> {
    const deliveryPerson =
      await this.deliveryPeopleRepository.findByEmail(email);

    if (!deliveryPerson) {
      return left(new WrongCredentialsError());
    }

    const doesPasswordMatches = await this.hashComparer.compare(
      password,
      deliveryPerson.password
    );

    if (!doesPasswordMatches) {
      return left(new WrongCredentialsError());
    }

    const hasTheEmailBeenVerified = deliveryPerson.isEmailValidated;

    if (!hasTheEmailBeenVerified) {
      return left(new EmailCodeHasNotBeenVerifiedError());
    }

    const isPasswordValid = await this.passwordValidator.validate(newPassword);

    if (!isPasswordValid) {
      return left(new ExternalPasswordValidationError());
    }

    const newPasswordHashed = await this.hashGenerator.hash(newPassword);

    const passwordUpdatedResult =
      deliveryPerson.updatePassword(newPasswordHashed);

    if (passwordUpdatedResult.isLeft()) {
      return left(passwordUpdatedResult.value);
    }

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson });
  }
}
