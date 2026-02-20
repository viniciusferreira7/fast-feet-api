import { type Either, left, right } from '@/core/either';
import type { Encrypter } from '../cryptography/encrypter';
import type { HashComparer } from '../cryptography/hash-comparer';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface AuthenticateDeliveryPersonUseCaseRequest {
  cpf: string;
  password: string;
}

export type AuthenticateDeliveryPersonUseCaseResponse = Either<
  | WrongCredentialsError
  | EmailCodeHasNotBeenVerifiedError
  | DeliveryPersonProfileIsDisableError,
  { accessToken: string }
>;

export class AuthenticateDeliveryPerson {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter
  ) {}

  async execute({
    cpf,
    password,
  }: AuthenticateDeliveryPersonUseCaseRequest): Promise<AuthenticateDeliveryPersonUseCaseResponse> {
    const deliveryPerson = await this.deliveryPeopleRepository.findByCpf(cpf);

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

    const accessToken = await this.encrypter.encrypt({
      sub: deliveryPerson.id.toString(),
    });

    return right({ accessToken });
  }
}
