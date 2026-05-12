import { FakeHasher } from 'test/cryptography/fake-hasher';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { FakePasswordValidator } from 'test/validation/fake-password-validator';
import { left } from '@/core/either';
import { WeakPasswordError } from '../../errors/weak-password-error';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';
import { ResetDeliveryPersonPassword } from './reset-delivery-person-password';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let passwordValidator: FakePasswordValidator;
let hashGenerator: FakeHasher;
let hashComparer: FakeHasher;
let sut: ResetDeliveryPersonPassword;

describe('Reset Delivery Person Password', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    passwordValidator = new FakePasswordValidator();
    hashGenerator = new FakeHasher();
    hashComparer = new FakeHasher();
    sut = new ResetDeliveryPersonPassword(
      deliveryPeopleRepository,
      passwordValidator,
      hashGenerator,
      hashComparer
    );
  });

  it('should be able to reset delivery person password', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.password).toBe('new-password-hashed');
    }
  });

  it('should hash new password upon reset', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'new-strong-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.password).toBe(
        'new-strong-password-hashed'
      );
    }
  });

  it('should not be able to reset password when profile is disabled', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
      isActive: false,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DeliveryPersonProfileIsDisableError);
    }
  });

  it('should not be able to reset password with wrong email', async () => {
    const result = await sut.execute({
      email: 'nonexistent@example.com',
      password: 'any-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should not be able to reset password with wrong current password', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'correct-password-hashed',
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'wrong-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should not be able to reset password if email is not verified', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
      emailVerification: null,
      emailVerifiedAt: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailCodeHasNotBeenVerifiedError);
    }
  });

  it('should not be able to reset password with weak new password', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    vi.spyOn(passwordValidator, 'validate').mockReturnValueOnce(
      left(new WeakPasswordError())
    );

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'weak',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WeakPasswordError);
    }
  });

  it('should validate new password strength before reset', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const validateSpy = vi.spyOn(passwordValidator, 'validate');

    await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'newStrongPassword123',
    });

    expect(validateSpy).toHaveBeenCalledWith('newStrongPassword123');
  });

  it('should update delivery person in repository', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    const updatedPerson =
      await deliveryPeopleRepository.findByEmail('john@example.com');

    expect(updatedPerson).toBeTruthy();
    expect(updatedPerson?.password).toBe('new-password-hashed');
  });

  it('should compare current password with stored password', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      password: 'old-password-hashed',
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const compareSpy = vi.spyOn(hashComparer, 'compare');

    await sut.execute({
      email: 'john@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(compareSpy).toHaveBeenCalledWith(
      'old-password',
      'old-password-hashed'
    );
  });
});
