import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { Encrypter } from '../cryptography/encrypter';
import { HashComparer } from '../cryptography/hash-comparer';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface AuthenticateAdminPersonUseCaseRequest {
  cpf: string;
  password: string;
}

export type AuthenticateAdminPersonUseCaseResponse = Either<
  WrongCredentialsError | EmailCodeHasNotBeenVerifiedError,
  { accessToken: string }
>;

@Injectable()
export class AuthenticateAdminPersonUseCase {
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

    const hasTheEmailBeenVerified = adminPerson.isEmailValidated;

    if (!hasTheEmailBeenVerified) {
      return left(new EmailCodeHasNotBeenVerifiedError());
    }

    const accessToken = await this.encrypter.encrypt({
      sub: adminPerson.id.toString(),
    });

    return right({ accessToken });
  }
}
