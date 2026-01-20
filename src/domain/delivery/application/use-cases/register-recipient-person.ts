import { type Either, left, right } from '@/core/either';
import { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { HashGenerator } from '../cryptography/hash-generator';
import { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';

interface RegisterRecipientPersonUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
}

type RegisterRecipientPersonUseCaseResponse = Either<
  InvalidateCpfError | PersonAlreadyExistsError,
  {
    recipientPerson: RecipientPerson;
  }
>;

export class RegisterRecipientPerson {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
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

    const hashedPassword = await this.hashGenerator.hash(password);

    const recipientPerson = RecipientPerson.create({
      name,
      cpf: recipientPersonCpf.value,
      email,
      password: hashedPassword,
    });

    await this.recipientPeopleRepository.register(recipientPerson);

    return right({ recipientPerson });
  }
}
