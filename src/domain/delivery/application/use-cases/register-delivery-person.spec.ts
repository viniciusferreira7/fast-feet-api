import { generate as generateCpf } from 'gerador-validador-cpf';
import { FakeHasher } from 'test/cryptography/fake-hasher';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { FakeCpfValidator } from 'test/validation/fake-cpf-validator';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { ExternalCpfValidationError } from '../../errors/external-cpf-validation-error';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';
import { RegisterDeliveryPerson } from './register-delivery-person';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let hashGenerator: FakeHasher;
let cpfValidator: FakeCpfValidator;
let sut: RegisterDeliveryPerson;

describe('Register Delivery Person', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    hashGenerator = new FakeHasher();
    cpfValidator = new FakeCpfValidator();
    sut = new RegisterDeliveryPerson(
      deliveryPeopleRepository,
      hashGenerator,
      cpfValidator
    );
  });

  it('should be able to register a new delivery person', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson).toBeInstanceOf(DeliveryPerson);
      expect(result.value.deliveryPerson.name).toBe('John Doe');
      expect(result.value.deliveryPerson.email).toBe('john@example.com');
      expect(result.value.deliveryPerson.password).toBe('123456-hashed');
    }
  });

  it('should hash delivery person password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.password).toBe('123456-hashed');
    }
  });

  it('should not be able to register with same CPF twice', async () => {
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
    });

    const result = await sut.execute({
      name: 'Jane Doe',
      cpf,
      email: 'jane@example.com',
      password: '123456',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PersonAlreadyExistsError);
    }
  });

  it('should not be able to register with same email twice', async () => {
    await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    const result = await sut.execute({
      name: 'Jane Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PersonAlreadyExistsError);
    }
  });

  it('should not be able to register with invalid CPF', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: 'invalid-cpf',
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidateCpfError);
    }
  });

  it('should store delivery person in repository', async () => {
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
    });

    expect(deliveryPeopleRepository.deliveryPeople).toHaveLength(1);
    expect(deliveryPeopleRepository.deliveryPeople[0].name).toBe('John Doe');
    expect(deliveryPeopleRepository.deliveryPeople[0].cpf.value).toBe(cpf);
  });

  it('should create delivery person with correct CPF value object', async () => {
    const cpfRaw = generateCpf();

    const result = await sut.execute({
      name: 'John Doe',
      cpf: cpfRaw,
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.cpf).toBeInstanceOf(Cpf);
      expect(result.value.deliveryPerson.cpf.value).toBe(cpfRaw);
    }
  });

  it('should not be able to register with CPF that fails external validation', async () => {
    vi.spyOn(cpfValidator, 'validate').mockResolvedValueOnce(false);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalCpfValidationError);
    }
  });
});
