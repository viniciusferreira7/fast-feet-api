import { FakeHasher } from 'test/cryptography/fake-hasher';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { FakePasswordValidator } from 'test/validation/fake-password-validator';
import { WeakPasswordError } from '../../errors/weak-password-error';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';
import { ResetRecipientPersonPassword } from './reset-recipient-person-password';

let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let passwordValidator: FakePasswordValidator;
let hashGenerator: FakeHasher;
let hashComparer: FakeHasher;
let sut: ResetRecipientPersonPassword;

describe('Reset Recipient Person Password', () => {
  beforeEach(() => {
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    passwordValidator = new FakePasswordValidator();
    hashGenerator = new FakeHasher();
    hashComparer = new FakeHasher();
    sut = new ResetRecipientPersonPassword(
      recipientPeopleRepository,
      passwordValidator,
      hashGenerator,
      hashComparer
    );
  });

  it('should be able to reset recipient person password', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'old-password-hashed',
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.password).toBe('new-password-hashed');
    }
  });

  it('should hash new password upon reset', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'old-password-hashed',
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
      password: 'old-password',
      newPassword: 'new-strong-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.password).toBe(
        'new-strong-password-hashed'
      );
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
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'correct-password-hashed',
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
      password: 'wrong-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should not be able to reset password if email is not verified', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'old-password-hashed',
      emailVerification: null,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailCodeHasNotBeenVerifiedError);
    }
  });

  it('should not be able to reset password with weak new password', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'old-password-hashed',
    });

    await recipientPeopleRepository.register(recipientPerson);

    vi.spyOn(passwordValidator, 'validate').mockResolvedValueOnce(false);

    const result = await sut.execute({
      email: 'recipient@example.com',
      password: 'old-password',
      newPassword: 'weak',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WeakPasswordError);
    }
  });

  it('should validate new password strength before reset', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'old-password-hashed',
    });

    await recipientPeopleRepository.register(recipientPerson);

    const validateSpy = vi.spyOn(passwordValidator, 'validate');

    await sut.execute({
      email: 'recipient@example.com',
      password: 'old-password',
      newPassword: 'newStrongPassword123',
    });

    expect(validateSpy).toHaveBeenCalledWith('newStrongPassword123');
  });

  it('should update recipient person in repository', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'old-password-hashed',
    });

    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      email: 'recipient@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    const updatedPerson = await recipientPeopleRepository.findByEmail(
      'recipient@example.com'
    );

    expect(updatedPerson).toBeTruthy();
    expect(updatedPerson?.password).toBe('new-password-hashed');
  });

  it('should compare current password with stored password', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      password: 'old-password-hashed',
    });

    await recipientPeopleRepository.register(recipientPerson);

    const compareSpy = vi.spyOn(hashComparer, 'compare');

    await sut.execute({
      email: 'recipient@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(compareSpy).toHaveBeenCalledWith(
      'old-password',
      'old-password-hashed'
    );
  });
});
