import { type Either, left, right } from '@/core/either';
import type { Encrypter } from '../cryptography/encrypter';
import type { HashComparer } from '../cryptography/hash-comparer';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface AuthenticateDeliveryPersonUseCaseRequest {
  cpf: string;
  password: string;
}

export type AuthenticateDeliveryPersonUseCaseResponse = Either<
  WrongCredentialsError,
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

    const doesPasswordMatches = await this.hashComparer.compare(
      password,
      deliveryPerson.password
    );

    if (!doesPasswordMatches) {
      return left(new WrongCredentialsError());
    }

    const accessToken = await this.encrypter.encrypt({
      sub: deliveryPerson.id.toString(),
    });

    return right({ accessToken });
  }
}
