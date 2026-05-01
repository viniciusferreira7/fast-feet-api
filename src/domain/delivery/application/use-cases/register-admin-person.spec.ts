import { generate as generateCpf } from 'gerador-validador-cpf';
import { FakeHasher } from 'test/cryptography/fake-hasher';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { FakePasswordValidator } from 'test/validation/fake-password-validator';
import { left } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { AdminPerson } from '../../enterprise/entities/admin-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { WeakPasswordError } from '../../errors/weak-password-error';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';
import { RegisterAdminPersonUseCase } from './register-admin-person';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let passwordValidator: FakePasswordValidator;
let hashGenerator: FakeHasher;
let sut: RegisterAdminPersonUseCase;

describe('Register Admin Person', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    passwordValidator = new FakePasswordValidator();
    hashGenerator = new FakeHasher();
    sut = new RegisterAdminPersonUseCase(
      adminPeopleRepository,
      passwordValidator,
      hashGenerator
    );
  });

  it('should be able to register a new admin person', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
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
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.password).toBe('123456-hashed');
    }
  });

  it('should not be able to register with same CPF twice', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    const result = await sut.execute({
      name: 'Jane Doe',
      cpf,
      email: 'jane@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PersonAlreadyExistsError);
    }
  });

  it('should not be able to register with same email twice', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);

    await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    const result = await sut.execute({
      name: 'Jane Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PersonAlreadyExistsError);
    }
  });

  it('should not be able to register with invalid CPF', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);

    const result = await sut.execute({
      name: 'John Doe',
      cpf: 'invalid-cpf',
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidateCpfError);
    }
  });

  it('should store admin person in repository', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    expect(adminPeopleRepository.adminPeople).toHaveLength(2);
    const registered = adminPeopleRepository.adminPeople.find(
      (p) => p.name === 'John Doe'
    );
    expect(registered?.cpf.value).toBe(cpf);
  });

  it('should create admin person with correct CPF value object', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);
    const cpfRaw = generateCpf();

    const result = await sut.execute({
      name: 'John Doe',
      cpf: cpfRaw,
      email: 'john@example.com',
      password: '123456',
      authorId: author.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.cpf).toBeInstanceOf(Cpf);
      expect(result.value.adminPerson.cpf.value).toBe(cpfRaw);
    }
  });

  it('should not be able to register with weak password', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);
    vi.spyOn(passwordValidator, 'validate').mockReturnValueOnce(
      left(new WeakPasswordError())
    );

    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: 'weak',
      authorId: author.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WeakPasswordError);
    }
  });

  it('should validate password strength before registration', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);
    const validateSpy = vi.spyOn(passwordValidator, 'validate');

    await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: 'strongPassword123',
      authorId: author.id.toString(),
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
