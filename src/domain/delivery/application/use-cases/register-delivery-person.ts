import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { HashGenerator } from '../cryptography/hash-generator';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PasswordValidator } from '../validation/password-validator';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';

interface RegisterDeliveryPersonUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
  authorId: string;
}

type RegisterDeliveryPersonUseCaseResponse = Either<
  | InvalidateCpfError
  | PersonAlreadyExistsError
  | ExternalPasswordValidationError
  | ResourceNotFoundError,
  {
    deliveryPerson: DeliveryPerson;
  }
>;

export class RegisterDeliveryPerson {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly passwordValidator: PasswordValidator,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    cpf,
    email,
    password,
    authorId,
  }: RegisterDeliveryPersonUseCaseRequest): Promise<RegisterDeliveryPersonUseCaseResponse> {
    const [
      deliveryPersonWithSameCpf,
      deliveryPersonWithSameEmail,
      adminPerson,
    ] = await Promise.all([
      this.deliveryPeopleRepository.findByCpf(cpf),
      this.deliveryPeopleRepository.findByEmail(email),
      this.adminPeopleRepository.findById(authorId),
    ]);

    if (deliveryPersonWithSameCpf) {
      return left(new PersonAlreadyExistsError(cpf));
    }

    if (deliveryPersonWithSameEmail) {
      return left(new PersonAlreadyExistsError(email));
    }

    if (!adminPerson) {
      return left(new ResourceNotFoundError('admin'));
    }

    const DeliveryPersonCpf = Cpf.create(cpf);

    if (DeliveryPersonCpf.isLeft()) {
      return left(DeliveryPersonCpf.value);
    }

    const isPasswordValid = await this.passwordValidator.validate(password);

    if (!isPasswordValid) {
      return left(new ExternalPasswordValidationError());
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    const deliveryPerson = DeliveryPerson.create({
      name,
      cpf: DeliveryPersonCpf.value,
      email,
      password: hashedPassword,
      emailVerification: null,
    });

    await this.deliveryPeopleRepository.register(deliveryPerson);

    return right({ deliveryPerson });
  }
}
