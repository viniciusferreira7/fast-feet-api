import { FakeEmailSender } from 'test/email/fake-email-sender';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { EmailVerification } from '../../enterprise/entities/email-verification';
import { TimeToSendNewEmailCodeError } from './errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';
import { SendDeliveryPersonCodeUseCase } from './send-delivery-person-code';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let emailSender: FakeEmailSender;
let sut: SendDeliveryPersonCodeUseCase;

describe('Send Delivery Person Code', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    emailSender = new FakeEmailSender();
    sut = new SendDeliveryPersonCodeUseCase(
      deliveryPeopleRepository,
      emailSender
    );
  });

  it('should be able to send a verification code to a delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      emailVerification: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson).toBeTruthy();
      expect(result.value.deliveryPerson.emailVerification).toBeTruthy();
      expect(result.value.deliveryPerson.emailVerification?.code).toBeTruthy();
    }
  });

  it('should send an email with the verification code', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      emailVerification: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      email: 'john@example.com',
    });

    expect(emailSender.sentEmails).toHaveLength(1);
    expect(emailSender.sentEmails[0]).toEqual({
      title: 'Fast Feet sent a code confirmation',
      content: expect.stringContaining('Your new code is'),
      to: 'john@example.com',
    });
  });

  it('should update the delivery person with the new verification code', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      emailVerification: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      email: 'john@example.com',
    });

    const updatedDeliveryPerson =
      await deliveryPeopleRepository.findByEmail('john@example.com');

    expect(updatedDeliveryPerson?.emailVerification).toBeTruthy();
    expect(updatedDeliveryPerson?.emailVerification?.code).toBeTruthy();
  });

  it('should not be able to send code to non-existent email', async () => {
    const result = await sut.execute({
      email: 'nonexistent@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should send a new code if the existing code has expired', async () => {
    const fiveMinutesAndOneSecondAgo = new Date(
      Date.now() - 5 * 60 * 1000 - 1000
    );

    const emailVerificationResult = EmailVerification.create({
      createdAt: fiveMinutesAndOneSecondAgo,
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      emailVerification: emailVerificationResult.value,
    });

    const oldCode = deliveryPerson.emailVerification?.code.code;

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.emailVerification?.code.code).not.toBe(
        oldCode
      );
    }
    expect(emailSender.sentEmails).toHaveLength(1);
  });

  it('should not send a new code if the existing code has not expired', async () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const emailVerificationResult = EmailVerification.create({
      createdAt: twoMinutesAgo,
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TimeToSendNewEmailCodeError);
    }
    expect(emailSender.sentEmails).toHaveLength(0);
  });

  it('should return error message with time info when trying to send too soon', async () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const emailVerificationResult = EmailVerification.create({
      createdAt: twoMinutesAgo,
      validatedAt: null,
    });

    if (emailVerificationResult.isLeft()) {
      throw new Error('Failed to create email verification');
    }

    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (
      result.isLeft() &&
      result.value instanceof TimeToSendNewEmailCodeError
    ) {
      expect(result.value.message).toContain(
        'Wait until existing e-mail code expired'
      );
    }
  });

  it('should create and send a code when delivery person has no email verification', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'john@example.com',
      emailVerification: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      email: 'john@example.com',
    });

    expect(result.isRight()).toBe(true);
    expect(emailSender.sentEmails).toHaveLength(1);

    const updatedDeliveryPerson =
      await deliveryPeopleRepository.findByEmail('john@example.com');

    expect(updatedDeliveryPerson?.emailVerification).toBeTruthy();
  });

  it('should send email to the correct recipient', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'correct-email@example.com',
      emailVerification: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      email: 'correct-email@example.com',
    });

    expect(emailSender.sentEmails[0].to).toBe('correct-email@example.com');
  });
});
