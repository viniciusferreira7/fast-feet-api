import { generate as generateCpf } from 'gerador-validador-cpf';
import { FakeHasher } from 'test/cryptography/fake-hasher';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { FakePasswordValidator } from 'test/validation/fake-password-validator';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';
import { RegisterDeliveryPerson } from './register-delivery-person';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let passwordValidator: FakePasswordValidator;
let hashGenerator: FakeHasher;
let sut: RegisterDeliveryPerson;

describe('Register Delivery Person', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    passwordValidator = new FakePasswordValidator();
    hashGenerator = new FakeHasher();
    sut = new RegisterDeliveryPerson(
      deliveryPeopleRepository,
      adminPeopleRepository,
      passwordValidator,
      hashGenerator
    );
  });

  it('should be able to register a new delivery person', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
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
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.password).toBe('123456-hashed');
    }
  });

  it('should not be able to register with same CPF twice', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    const result = await sut.execute({
      name: 'Jane Doe',
      cpf,
      email: 'jane@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PersonAlreadyExistsError);
    }
  });

  it('should not be able to register with same email twice', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    const result = await sut.execute({
      name: 'Jane Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PersonAlreadyExistsError);
    }
  });

  it('should not be able to register with invalid CPF', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: 'invalid-cpf',
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidateCpfError);
    }
  });

  it('should store delivery person in repository', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    expect(deliveryPeopleRepository.deliveryPeople).toHaveLength(1);
    expect(deliveryPeopleRepository.deliveryPeople[0].name).toBe('John Doe');
    expect(deliveryPeopleRepository.deliveryPeople[0].cpf.value).toBe(cpf);
  });

  it('should create delivery person with correct CPF value object', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);
    const cpfRaw = generateCpf();

    const result = await sut.execute({
      name: 'John Doe',
      cpf: cpfRaw,
      email: 'john@example.com',
      password: '123456',
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.cpf).toBeInstanceOf(Cpf);
      expect(result.value.deliveryPerson.cpf.value).toBe(cpfRaw);
    }
  });

  it('should not be able to register with weak password', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);
    vi.spyOn(passwordValidator, 'validate').mockResolvedValueOnce(false);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: 'weak',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalPasswordValidationError);
    }
  });

  it('should validate password strength before registration', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);
    const validateSpy = vi.spyOn(passwordValidator, 'validate');

    await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: 'strongPassword123',
      authorId: admin.id.toString(),
    });

    expect(validateSpy).toHaveBeenCalledWith('strongPassword123');
  });

  it('should not be able to register if author admin does not exist', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: 'non-existent-admin-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });
});
