import { generate as generateCpf } from 'gerador-validador-cpf';
import { FakeHasher } from 'test/cryptography/fake-hasher';
import { FakeEncrypter } from 'test/cryptography/faker-encrypter';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { AuthenticateRecipientPerson } from './authenticate-recipient-person';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let fakeHasher: FakeHasher;
let fakeEncrypter: FakeEncrypter;
let sut: AuthenticateRecipientPerson;

describe('Authenticate Recipient Person', () => {
  beforeEach(() => {
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    fakeHasher = new FakeHasher();
    fakeEncrypter = new FakeEncrypter();
    sut = new AuthenticateRecipientPerson(
      recipientPeopleRepository,
      fakeHasher,
      fakeEncrypter
    );
  });

  it('should be able to authenticate an recipient person', async () => {
    const cpfString = generateCpf();
    const cpfResult = Cpf.create(cpfString);

    if (cpfResult.isLeft()) {
      throw new Error('Failed to create CPF');
    }

    const recipientPerson = makeRecipientPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      cpf: cpfString,
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toEqual({
        accessToken: expect.any(String),
      });
    }
  });

  it('should generate a valid access token upon authentication', async () => {
    const cpfString = generateCpf();
    const cpfResult = Cpf.create(cpfString);

    if (cpfResult.isLeft()) {
      throw new Error('Failed to create CPF');
    }

    const recipientPerson = makeRecipientPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      cpf: cpfString,
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessToken).toBeTruthy();
      const payload = JSON.parse(result.value.accessToken);
      expect(payload.sub).toBe(recipientPerson.id.toString());
    }
  });

  it('should not be able to authenticate with non-existent CPF', async () => {
    const result = await sut.execute({
      cpf: generateCpf(),
      password: '123456',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should not be able to authenticate with wrong password', async () => {
    const cpfString = generateCpf();
    const cpfResult = Cpf.create(cpfString);

    if (cpfResult.isLeft()) {
      throw new Error('Failed to create CPF');
    }

    const recipientPerson = makeRecipientPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      cpf: cpfString,
      password: 'wrong-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should compare password correctly using hash comparer', async () => {
    const cpfString = generateCpf();
    const cpfResult = Cpf.create(cpfString);

    if (cpfResult.isLeft()) {
      throw new Error('Failed to create CPF');
    }

    const recipientPerson = makeRecipientPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await recipientPeopleRepository.register(recipientPerson);

    const compareSpy = vi.spyOn(fakeHasher, 'compare');

    await sut.execute({
      cpf: cpfString,
      password: '123456',
    });

    expect(compareSpy).toHaveBeenCalledWith('123456', '123456-hashed');
  });

  it('should encrypt recipient person id into access token', async () => {
    const cpfString = generateCpf();
    const cpfResult = Cpf.create(cpfString);

    if (cpfResult.isLeft()) {
      throw new Error('Failed to create CPF');
    }

    const recipientPerson = makeRecipientPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await recipientPeopleRepository.register(recipientPerson);

    const encryptSpy = vi.spyOn(fakeEncrypter, 'encrypt');

    await sut.execute({
      cpf: cpfString,
      password: '123456',
    });

    expect(encryptSpy).toHaveBeenCalledWith({
      sub: recipientPerson.id.toString(),
    });
  });
});
