import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { EmailVerification } from '../../enterprise/entities/email-verification';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { ValidDeliveryPersonUseCase } from './validate-delivery-person-code';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: ValidDeliveryPersonUseCase;

describe('Validate Delivery Person Code', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new ValidDeliveryPersonUseCase(deliveryPeopleRepository);
  });

  it('should be able to validate a delivery person with correct code', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'delivery@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson).toBeTruthy();
      expect(result.value.deliveryPerson.email).toBe('delivery@example.com');
      expect(result.value.deliveryPerson.isEmailValidated).toBe(true);
    }
  });

  it('should return error when delivery person profile is disabled', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
      isActive: false,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'delivery@example.com',
      code,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DeliveryPersonProfileIsDisableError);
    }
  });

  it('should return error when delivery person is not found', async () => {
    const result = await sut.execute({
      email: 'nonexistent@example.com',
      code: '12345678',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toContain('delivery');
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

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'delivery@example.com',
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

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const wrongCode = '99999999';

    const result = await sut.execute({
      email: 'delivery@example.com',
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

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'delivery@example.com',
      code,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailCodeHasNotBeenVerifiedError);
    }
  });

  it('should update delivery person in repository after successful validation', async () => {
    const emailVerificationResult = EmailVerification.create({
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'delivery@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);

    const updatedDeliveryPerson = await deliveryPeopleRepository.findByEmail(
      'delivery@example.com'
    );

    expect(updatedDeliveryPerson).toBeTruthy();
    expect(updatedDeliveryPerson?.isEmailValidated).toBe(true);
    expect(updatedDeliveryPerson?.emailVerification?.validatedAt).toBeTruthy();
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

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    const result = await sut.execute({
      email: 'delivery@example.com',
      code,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.isEmailValidated).toBe(true);
    }
  });

  it('should handle delivery person without email verification', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'delivery@example.com',
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

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^\d{8}$/);

    const result = await sut.execute({
      email: 'delivery@example.com',
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

    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const code = emailVerificationResult.value.verificationCode.code;

    expect(deliveryPerson.emailVerification?.validatedAt).toBeNull();

    const before = Date.now();
    const result = await sut.execute({
      email: 'delivery@example.com',
      code,
    });
    const after = Date.now();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const validatedAt =
        result.value.deliveryPerson.emailVerification?.validatedAt;
      expect(validatedAt).toBeTruthy();
      if (validatedAt) {
        const validatedTime = validatedAt.getTime();
        expect(validatedTime).toBeGreaterThanOrEqual(before);
        expect(validatedTime).toBeLessThanOrEqual(after);
      }
    }
  });
});
