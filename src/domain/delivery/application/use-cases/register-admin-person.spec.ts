import { generate as generateCpf } from 'gerador-validador-cpf';
import { FakeHasher } from 'test/cryptography/fake-hasher';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { FakePasswordValidator } from 'test/validation/fake-password-validator';
import { AdminPerson } from '../../enterprise/entities/admin-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';
import { RegisterAdminPerson } from './register-admin-person';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let passwordValidator: FakePasswordValidator;
let hashGenerator: FakeHasher;
let sut: RegisterAdminPerson;

describe('Register Admin Person', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    passwordValidator = new FakePasswordValidator();
    hashGenerator = new FakeHasher();
    sut = new RegisterAdminPerson(
      adminPeopleRepository,
      passwordValidator,
      hashGenerator
    );
  });

  it('should be able to register a new admin person', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson).toBeInstanceOf(AdminPerson);
      expect(result.value.adminPerson.name).toBe('John Doe');
      expect(result.value.adminPerson.email).toBe('john@example.com');
      expect(result.value.adminPerson.password).toBe('123456-hashed');
    }
  });

  it('should hash admin person password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.password).toBe('123456-hashed');
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

  it('should store admin person in repository', async () => {
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
    });

    expect(adminPeopleRepository.adminPeople).toHaveLength(1);
    expect(adminPeopleRepository.adminPeople[0].name).toBe('John Doe');
    expect(adminPeopleRepository.adminPeople[0].cpf.value).toBe(cpf);
  });

  it('should create admin person with correct CPF value object', async () => {
    const cpfRaw = generateCpf();

    const result = await sut.execute({
      name: 'John Doe',
      cpf: cpfRaw,
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.cpf).toBeInstanceOf(Cpf);
      expect(result.value.adminPerson.cpf.value).toBe(cpfRaw);
    }
  });

  it('should not be able to register with weak password', async () => {
    vi.spyOn(passwordValidator, 'validate').mockResolvedValueOnce(false);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: 'weak',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalPasswordValidationError);
    }
  });

  it('should validate password strength before registration', async () => {
    const validateSpy = vi.spyOn(passwordValidator, 'validate');

    await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: 'strongPassword123',
    });

    expect(validateSpy).toHaveBeenCalledWith('strongPassword123');
  });
});
