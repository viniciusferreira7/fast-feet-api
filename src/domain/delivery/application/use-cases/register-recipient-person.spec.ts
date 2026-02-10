import { generate as generateCpf } from 'gerador-validador-cpf';
import { FakeHasher } from 'test/cryptography/fake-hasher';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { FakeCpfValidator } from 'test/validation/fake-cpf-validator';
import { FakePasswordValidator } from 'test/validation/fake-password-validator';
import { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { ExternalCpfValidationError } from '../../errors/external-cpf-validation-error';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { PersonAlreadyExistsError } from './errors/person-already-exists-error';
import { RegisterRecipientPerson } from './register-recipient-person';

let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let passwordValidator: FakePasswordValidator;
let hashGenerator: FakeHasher;
let cpfValidator: FakeCpfValidator;
let sut: RegisterRecipientPerson;

describe('Register Recipient Person', () => {
  beforeEach(() => {
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    passwordValidator = new FakePasswordValidator();
    hashGenerator = new FakeHasher();
    cpfValidator = new FakeCpfValidator();
    sut = new RegisterRecipientPerson(
      recipientPeopleRepository,
      passwordValidator,
      hashGenerator,
      cpfValidator
    );
  });

  it('should be able to register a new recipient person', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson).toBeInstanceOf(RecipientPerson);
      expect(result.value.recipientPerson.name).toBe('John Doe');
      expect(result.value.recipientPerson.email).toBe('john@example.com');
      expect(result.value.recipientPerson.password).toBe('123456-hashed');
    }
  });

  it('should hash recipient person password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: generateCpf(),
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.password).toBe('123456-hashed');
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

  it('should store recipient person in repository', async () => {
    const cpf = generateCpf();

    await sut.execute({
      name: 'John Doe',
      cpf,
      email: 'john@example.com',
      password: '123456',
    });

    expect(recipientPeopleRepository.recipientPeople).toHaveLength(1);
    expect(recipientPeopleRepository.recipientPeople[0].name).toBe('John Doe');
    expect(recipientPeopleRepository.recipientPeople[0].cpf.value).toBe(cpf);
  });

  it('should create recipient person with correct CPF value object', async () => {
    const cpfRaw = generateCpf();

    const result = await sut.execute({
      name: 'John Doe',
      cpf: cpfRaw,
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.cpf).toBeInstanceOf(Cpf);
      expect(result.value.recipientPerson.cpf.value).toBe(cpfRaw);
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
