import { type Either, left, right } from '@/core/either';
import { AdminPerson } from '../../enterprise/entities/admin-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { ExternalCpfValidationError } from '../../errors/external-cpf-validation-error';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { HashGenerator } from '../cryptography/hash-generator';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { CpfValidator } from '../validation/cpf-validator';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';

interface RegisterAdminPersonUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
}

type RegisterAdminPersonUseCaseResponse = Either<
  InvalidateCpfError | PersonAlreadyExistsError | ExternalCpfValidationError,
  {
    adminPerson: AdminPerson;
  }
>;

export class RegisterAdminPerson {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly hashGenerator: HashGenerator,
    private readonly cpfValidator: CpfValidator
  ) {}

  async execute({
    name,
    cpf,
    email,
    password,
  }: RegisterAdminPersonUseCaseRequest): Promise<RegisterAdminPersonUseCaseResponse> {
    const [adminPersonWithSameCpf, adminPersonWithSameEmail] =
      await Promise.all([
        this.adminPeopleRepository.findByCpf(cpf),
        this.adminPeopleRepository.findByEmail(email),
      ]);

    if (adminPersonWithSameCpf) {
      return left(new PersonAlreadyExistsError(cpf));
    }

    if (adminPersonWithSameEmail) {
      return left(new PersonAlreadyExistsError(email));
    }

    const isCpfValid = await this.cpfValidator.validate(cpf);

    if (!isCpfValid) {
      return left(new ExternalCpfValidationError());
    }

    const adminPersonCpf = Cpf.create(cpf);

    if (adminPersonCpf.isLeft()) {
      return left(adminPersonCpf.value);
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    const adminPerson = AdminPerson.create({
      name,
      cpf: adminPersonCpf.value,
      email,
      password: hashedPassword,
    });

    await this.adminPeopleRepository.register(adminPerson);

    return right({ adminPerson });
  }
}
