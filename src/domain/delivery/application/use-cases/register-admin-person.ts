import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { AdminPerson } from '../../enterprise/entities/admin-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { WeakPasswordError } from '../../errors/weak-password-error';
import { HashGenerator } from '../cryptography/hash-generator';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import type { PasswordValidator } from '../validation/password-validator';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';

interface RegisterAdminPersonUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
  authorId: string;
}

type RegisterAdminPersonUseCaseResponse = Either<
  | InvalidateCpfError
  | PersonAlreadyExistsError
  | WeakPasswordError
  | ResourceNotFoundError,
  {
    adminPerson: AdminPerson;
  }
>;

export class RegisterAdminPerson {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly passwordValidator: PasswordValidator,
    private readonly hashGenerator: HashGenerator
  ) {}

  async execute({
    name,
    cpf,
    email,
    password,
    authorId,
  }: RegisterAdminPersonUseCaseRequest): Promise<RegisterAdminPersonUseCaseResponse> {
    const [adminPersonWithSameCpf, adminPersonWithSameEmail, author] =
      await Promise.all([
        this.adminPeopleRepository.findByCpf(cpf),
        this.adminPeopleRepository.findByEmail(email),
        this.adminPeopleRepository.findById(authorId),
      ]);

    if (adminPersonWithSameCpf) {
      return left(new PersonAlreadyExistsError(cpf));
    }

    if (adminPersonWithSameEmail) {
      return left(new PersonAlreadyExistsError(email));
    }

    if (!author) {
      return left(new ResourceNotFoundError('admin'));
    }

    const adminPersonCpf = Cpf.create(cpf);

    if (adminPersonCpf.isLeft()) {
      return left(adminPersonCpf.value);
    }

    const passwordValidation = this.passwordValidator.validate(password);

    if (passwordValidation.isLeft()) {
      return left(passwordValidation.value);
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    const adminPerson = AdminPerson.create({
      name,
      cpf: adminPersonCpf.value,
      email,
      password: hashedPassword,
      emailVerification: null,
    });

    await this.adminPeopleRepository.register(adminPerson);

    return right({ adminPerson });
  }
}
