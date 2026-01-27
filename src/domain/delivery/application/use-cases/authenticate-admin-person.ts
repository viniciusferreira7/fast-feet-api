import { type Either, left, right } from '@/core/either';
import type { Encrypter } from '../cryptography/encrypter';
import type { HashComparer } from '../cryptography/hash-comparer';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface AuthenticateAdminPersonUseCaseRequest {
  cpf: string;
  password: string;
}

export type AuthenticateAdminPersonUseCaseResponse = Either<
  WrongCredentialsError,
  { accessToken: string }
>;

export class AuthenticateAdminPerson {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter
  ) {}

  async execute({
    cpf,
    password,
  }: AuthenticateAdminPersonUseCaseRequest): Promise<AuthenticateAdminPersonUseCaseResponse> {
    const adminPerson = await this.adminPeopleRepository.findByCpf(cpf);

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

    const accessToken = await this.encrypter.encrypt({
      sub: adminPerson.id.toString(),
    });

    return right({ accessToken });
  }
}
