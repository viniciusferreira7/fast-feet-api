import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { EmailVerification } from '../../enterprise/entities/email-verification';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import { ValidateRecipientPersonCodeUseCase } from './validate-recipient-person-code';

let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let sut: ValidateRecipientPersonCodeUseCase;

describe('Validate Recipient Person Code', () => {
  beforeEach(() => {
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    sut = new ValidateRecipientPersonCodeUseCase(recipientPeopleRepository);
  });

  it('should be able to validate a recipient person with correct code', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'recipient@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson).toBeTruthy();
      expect(result.value.recipientPerson.email).toBe('recipient@example.com');
      expect(result.value.recipientPerson.isEmailValidated).toBe(true);
    }
  });

  it('should return error when recipient person is not found', async () => {
    const result = await sut.execute({
      email: 'nonexistent@example.com',
      code: '12345678',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toContain('recipient');
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

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'recipient@example.com',
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

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const wrongCode = '99999999';

    const result = await sut.execute({
      email: 'recipient@example.com',
      code: wrongCode,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidEmailCodeError);
    }
  });

  it('should update recipient person in repository after successful validation', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'recipient@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);

    const updatedRecipientPerson = await recipientPeopleRepository.findByEmail(
      'recipient@example.com'
    );

    expect(updatedRecipientPerson).toBeTruthy();
    expect(updatedRecipientPerson?.isEmailValidated).toBe(true);
    expect(updatedRecipientPerson?.emailVerifiedAt).toBeTruthy();
    expect(updatedRecipientPerson?.emailVerification).toBeNull();
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

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'recipient@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.isEmailValidated).toBe(true);
    }
  });

  it('should handle recipient person without email verification', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: null,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
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

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^\d{8}$/);

    const result = await sut.execute({
      email: 'recipient@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
  });

  it('should set emailVerifiedAt and clear emailVerification when code is successfully validated', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    expect(recipientPerson.emailVerification?.validatedAt).toBeNull();

    const before = Date.now();
    const result = await sut.execute({
      email: 'recipient@example.com',
      code,
    });
    const after = Date.now();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const emailVerifiedAt = result.value.recipientPerson.emailVerifiedAt;
      expect(emailVerifiedAt).toBeTruthy();
      if (emailVerifiedAt) {
        const verifiedTime = emailVerifiedAt.getTime();
        expect(verifiedTime).toBeGreaterThanOrEqual(before);
        expect(verifiedTime).toBeLessThanOrEqual(after);
      }
      expect(result.value.recipientPerson.emailVerification).toBeNull();
    }
  });
});
