import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { WeakPasswordError } from '../../errors/weak-password-error';
import { HashGenerator } from '../cryptography/hash-generator';
import { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { PasswordValidator } from '../validation/password-validator';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';

interface RegisterRecipientPersonUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
}

type RegisterRecipientPersonUseCaseResponse = Either<
  InvalidateCpfError | PersonAlreadyExistsError | WeakPasswordError,
  {
    recipientPerson: RecipientPerson;
  }
>;

@Injectable()
export class RegisterRecipientPerson {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly passwordValidator: PasswordValidator,
    private readonly hashGenerator: HashGenerator
  ) {}

  async execute({
    name,
    cpf,
    email,
    password,
  }: RegisterRecipientPersonUseCaseRequest): Promise<RegisterRecipientPersonUseCaseResponse> {
    const [recipientPersonWithSameCpf, recipientPersonWithSameEmail] =
      await Promise.all([
        this.recipientPeopleRepository.findByCpf(cpf),
        this.recipientPeopleRepository.findByEmail(email),
      ]);

    if (recipientPersonWithSameCpf) {
      return left(new PersonAlreadyExistsError(cpf));
    }

    if (recipientPersonWithSameEmail) {
      return left(new PersonAlreadyExistsError(email));
    }

    const recipientPersonCpf = Cpf.create(cpf);

    if (recipientPersonCpf.isLeft()) {
      return left(recipientPersonCpf.value);
    }

    const passwordValidation = this.passwordValidator.validate(password);

    if (passwordValidation.isLeft()) {
      return left(passwordValidation.value);
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    const recipientPerson = RecipientPerson.create({
      name,
      cpf: recipientPersonCpf.value,
      email,
      password: hashedPassword,
      emailVerification: null,
    });

    await this.recipientPeopleRepository.register(recipientPerson);

    return right({ recipientPerson });
  }
}
