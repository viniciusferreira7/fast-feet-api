import { type Either, left, right } from '@/core/either';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { HashGenerator } from '../cryptography/hash-generator';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { PersonAlreadyExistsError } from './errors/person-already-exists';

interface RegisterDeliveryPersonUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
}

type RegisterDeliveryPersonUseCaseResponse = Either<
  InvalidateCpfError | PersonAlreadyExistsError,
  {
    deliveryPerson: DeliveryPerson;
  }
>;

export class RegisterDeliveryPerson {
  constructor(
    private readonly DeliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly hashGenerator: HashGenerator
  ) {}

  async execute({
    name,
    cpf,
    email,
    password,
  }: RegisterDeliveryPersonUseCaseRequest): Promise<RegisterDeliveryPersonUseCaseResponse> {
    const [DeliveryPersonWithSameCpf, DeliveryPersonWithSameEmail] =
      await Promise.all([
        this.DeliveryPeopleRepository.findByCpf(cpf),
        this.DeliveryPeopleRepository.findByEmail(email),
      ]);

    if (DeliveryPersonWithSameCpf) {
      return left(new PersonAlreadyExistsError(cpf));
    }

    if (DeliveryPersonWithSameEmail) {
      return left(new PersonAlreadyExistsError(email));
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

    await this.DeliveryPeopleRepository.register(deliveryPerson);

    return right({ deliveryPerson });
  }
}
