import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { WeakPasswordError } from '../../errors/weak-password-error';
import { HashComparer } from '../cryptography/hash-comparer';
import { HashGenerator } from '../cryptography/hash-generator';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { PasswordValidator } from '../validation/password-validator';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';
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
  | WeakPasswordError
  | DeliveryPersonProfileIsDisableError,
  { deliveryPerson: DeliveryPerson }
>;

@Injectable()
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

    if (!deliveryPerson?.isActive) {
      return left(new DeliveryPersonProfileIsDisableError());
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

    const passwordValidation = this.passwordValidator.validate(newPassword);

    if (passwordValidation.isLeft()) {
      return left(passwordValidation.value);
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
