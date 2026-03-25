import { makeAdminPerson } from 'test/factories/make-admin-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { EmailVerification } from '../../enterprise/entities/email-verification';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { ValidateAdminPersonCodeUseCase } from './validate-admin-person-code';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let sut: ValidateAdminPersonCodeUseCase;

describe('Validate Admin Person Code', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new ValidateAdminPersonCodeUseCase(adminPeopleRepository);
  });

  it('should be able to validate an admin person with correct code', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'admin@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson).toBeTruthy();
      expect(result.value.adminPerson.email).toBe('admin@example.com');
      expect(result.value.adminPerson.isEmailValidated).toBe(true);
    }
  });

  it('should return error when admin person is not found', async () => {
    const result = await sut.execute({
      email: 'nonexistent@example.com',
      code: '12345678',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toContain('admin');
    }
  });

  it('should return error when verification code has expired', async () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);

    const emailVerificationResult = EmailVerification.create({
      createdAt: sixMinutesAgo,
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'admin@example.com',
      code,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailCodeExpiredError);
    }
  });

  it('should return error when code is invalid', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const wrongCode = '99999999';

    const result = await sut.execute({
      email: 'admin@example.com',
      code: wrongCode,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidEmailCodeError);
    }
  });

  it('should return error when email has not been verified after code validation', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    vi.spyOn(emailVerificationResult.value, 'validateCode').mockImplementation(
      (code: string) => {
        return emailVerificationResult.value.verificationCode.validateCode(
          code
        );
      }
    );

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'admin@example.com',
      code,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailCodeHasNotBeenVerifiedError);
    }
  });

  it('should update admin person in repository after successful validation', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'admin@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);

    const updatedAdminPerson =
      await adminPeopleRepository.findByEmail('admin@example.com');

    expect(updatedAdminPerson).toBeTruthy();
    expect(updatedAdminPerson?.isEmailValidated).toBe(true);
    expect(updatedAdminPerson?.emailVerification?.validatedAt).toBeTruthy();
  });

  it('should validate code within expiration time (5 minutes)', async () => {
    const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000);

    const emailVerificationResult = EmailVerification.create({
      createdAt: fourMinutesAgo,
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'admin@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.isEmailValidated).toBe(true);
    }
  });

  it('should handle admin person without email verification', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: null,
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
      code: '12345678',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidEmailCodeError);
    }
  });

  it('should validate exact 8-digit code format', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^\d{8}$/);

    const result = await sut.execute({
      email: 'admin@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
  });

  it('should set validatedAt timestamp when code is successfully validated', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    expect(adminPerson.emailVerification?.validatedAt).toBeNull();

    const before = Date.now();
    const result = await sut.execute({
      email: 'admin@example.com',
      code,
    });
    const after = Date.now();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const validatedAt =
        result.value.adminPerson.emailVerification?.validatedAt;
      expect(validatedAt).toBeTruthy();
      if (validatedAt) {
        const validatedTime = validatedAt.getTime();
        expect(validatedTime).toBeGreaterThanOrEqual(before);
        expect(validatedTime).toBeLessThanOrEqual(after);
      }
    }
  });
});
