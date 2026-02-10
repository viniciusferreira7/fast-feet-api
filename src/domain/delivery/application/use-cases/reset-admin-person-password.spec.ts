import { FakeHasher } from 'test/cryptography/fake-hasher';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { FakePasswordValidator } from 'test/validation/fake-password-validator';
import { ExternalPasswordValidationError } from '../../errors/external-password-validation-error';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';
import { ResetAdminPersonPassword } from './reset-admin-person-password';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let passwordValidator: FakePasswordValidator;
let hashGenerator: FakeHasher;
let hashComparer: FakeHasher;
let sut: ResetAdminPersonPassword;

describe('Reset Admin Person Password', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    passwordValidator = new FakePasswordValidator();
    hashGenerator = new FakeHasher();
    hashComparer = new FakeHasher();
    sut = new ResetAdminPersonPassword(
      adminPeopleRepository,
      passwordValidator,
      hashGenerator,
      hashComparer
    );
  });

  it('should be able to reset admin person password', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'old-password-hashed',
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.password).toBe('new-password-hashed');
    }
  });

  it('should hash new password upon reset', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'old-password-hashed',
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
      password: 'old-password',
      newPassword: 'new-strong-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.password).toBe(
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
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'correct-password-hashed',
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
      password: 'wrong-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should not be able to reset password if email is not verified', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'old-password-hashed',
      emailVerification: null,
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailCodeHasNotBeenVerifiedError);
    }
  });

  it('should not be able to reset password with weak new password', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'old-password-hashed',
    });

    await adminPeopleRepository.register(adminPerson);

    vi.spyOn(passwordValidator, 'validate').mockResolvedValueOnce(false);

    const result = await sut.execute({
      email: 'admin@example.com',
      password: 'old-password',
      newPassword: 'weak',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalPasswordValidationError);
    }
  });

  it('should validate new password strength before reset', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'old-password-hashed',
    });

    await adminPeopleRepository.register(adminPerson);

    const validateSpy = vi.spyOn(passwordValidator, 'validate');

    await sut.execute({
      email: 'admin@example.com',
      password: 'old-password',
      newPassword: 'newStrongPassword123',
    });

    expect(validateSpy).toHaveBeenCalledWith('newStrongPassword123');
  });

  it('should update admin person in repository', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'old-password-hashed',
    });

    await adminPeopleRepository.register(adminPerson);

    await sut.execute({
      email: 'admin@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    const updatedPerson =
      await adminPeopleRepository.findByEmail('admin@example.com');

    expect(updatedPerson).toBeTruthy();
    expect(updatedPerson?.password).toBe('new-password-hashed');
  });

  it('should compare current password with stored password', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      password: 'old-password-hashed',
    });

    await adminPeopleRepository.register(adminPerson);

    const compareSpy = vi.spyOn(hashComparer, 'compare');

    await sut.execute({
      email: 'admin@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(compareSpy).toHaveBeenCalledWith(
      'old-password',
      'old-password-hashed'
    );
  });
});
