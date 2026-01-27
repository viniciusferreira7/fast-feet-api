import { type Either, left, right } from '@/core/either';
import type { Encrypter } from '../cryptography/encrypter';
import type { HashComparer } from '../cryptography/hash-comparer';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface AuthenticateRecipientPersonUseCaseRequest {
  cpf: string;
  password: string;
}

export type AuthenticateRecipientPersonUseCaseResponse = Either<
  WrongCredentialsError,
  { accessToken: string }
>;

export class AuthenticateRecipientPerson {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter
  ) {}

  async execute({
    cpf,
    password,
  }: AuthenticateRecipientPersonUseCaseRequest): Promise<AuthenticateRecipientPersonUseCaseResponse> {
    const recipientPerson = await this.recipientPeopleRepository.findByCpf(cpf);

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

    const accessToken = await this.encrypter.encrypt({
      sub: recipientPerson.id.toString(),
    });

    return right({ accessToken });
  }
}
