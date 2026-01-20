import { type Either, left, right } from '@/core/either';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { ExternalCpfValidationError } from '../../errors/external-cpf-validation-error';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { HashGenerator } from '../cryptography/hash-generator';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { CpfValidator } from '../validation/cpf-validator';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';

interface RegisterDeliveryPersonUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
}

type RegisterDeliveryPersonUseCaseResponse = Either<
  InvalidateCpfError | PersonAlreadyExistsError | ExternalCpfValidationError,
  {
    deliveryPerson: DeliveryPerson;
  }
>;

export class RegisterDeliveryPerson {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly hashGenerator: HashGenerator,
    private readonly cpfValidator: CpfValidator
  ) {}

  async execute({
    name,
    cpf,
    email,
    password,
  }: RegisterDeliveryPersonUseCaseRequest): Promise<RegisterDeliveryPersonUseCaseResponse> {
    const [DeliveryPersonWithSameCpf, DeliveryPersonWithSameEmail] =
      await Promise.all([
        this.deliveryPeopleRepository.findByCpf(cpf),
        this.deliveryPeopleRepository.findByEmail(email),
      ]);

    if (DeliveryPersonWithSameCpf) {
      return left(new PersonAlreadyExistsError(cpf));
    }

    if (DeliveryPersonWithSameEmail) {
      return left(new PersonAlreadyExistsError(email));
    }

    const isCpfValid = await this.cpfValidator.validate(cpf);

    if (!isCpfValid) {
      return left(new ExternalCpfValidationError());
    }

    const DeliveryPersonCpf = Cpf.create(cpf);

    if (DeliveryPersonCpf.isLeft()) {
      return left(DeliveryPersonCpf.value);
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    const deliveryPerson = DeliveryPerson.create({
      name,
      cpf: DeliveryPersonCpf.value,
      email,
      password: hashedPassword,
    });

    await this.deliveryPeopleRepository.register(deliveryPerson);

    return right({ deliveryPerson });
  }
}
