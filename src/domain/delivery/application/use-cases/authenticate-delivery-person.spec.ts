import { generate as generateCpf } from 'gerador-validador-cpf';
import { FakeHasher } from 'test/cryptography/fake-hasher';
import { FakeEncrypter } from 'test/cryptography/faker-encrypter';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { Cpf } from '../../enterprise/entities/value-object/cpf';
import { AuthenticateDeliveryPerson } from './authenticate-delivery-person';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let fakeHasher: FakeHasher;
let fakeEncrypter: FakeEncrypter;
let sut: AuthenticateDeliveryPerson;

describe('Authenticate Delivery Person', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    fakeHasher = new FakeHasher();
    fakeEncrypter = new FakeEncrypter();
    sut = new AuthenticateDeliveryPerson(
      deliveryPeopleRepository,
      fakeHasher,
      fakeEncrypter
    );
  });

  it('should be able to authenticate an delivery person', async () => {
    const cpfString = generateCpf();
    const cpfResult = Cpf.create(cpfString);

    if (cpfResult.isLeft()) {
      throw new Error('Failed to create CPF');
    }

    const deliveryPerson = makeDeliveryPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await deliveryPeopleRepository.register(deliveryPerson);

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

    const deliveryPerson = makeDeliveryPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      cpf: cpfString,
      password: '123456',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessToken).toBeTruthy();
      const payload = JSON.parse(result.value.accessToken);
      expect(payload.sub).toBe(deliveryPerson.id.toString());
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

    const deliveryPerson = makeDeliveryPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await deliveryPeopleRepository.register(deliveryPerson);

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

    const deliveryPerson = makeDeliveryPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const compareSpy = vi.spyOn(fakeHasher, 'compare');

    await sut.execute({
      cpf: cpfString,
      password: '123456',
    });

    expect(compareSpy).toHaveBeenCalledWith('123456', '123456-hashed');
  });

  it('should encrypt delivery person id into access token', async () => {
    const cpfString = generateCpf();
    const cpfResult = Cpf.create(cpfString);

    if (cpfResult.isLeft()) {
      throw new Error('Failed to create CPF');
    }

    const deliveryPerson = makeDeliveryPerson({
      cpf: cpfResult.value,
      password: await fakeHasher.hash('123456'),
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const encryptSpy = vi.spyOn(fakeEncrypter, 'encrypt');

    await sut.execute({
      cpf: cpfString,
      password: '123456',
    });

    expect(encryptSpy).toHaveBeenCalledWith({
      sub: deliveryPerson.id.toString(),
    });
  });
});
