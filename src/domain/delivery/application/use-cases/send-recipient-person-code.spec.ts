import { FakeEmailSender } from 'test/email/fake-email-sender';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { EmailVerification } from '../../enterprise/entities/email-verification';
import { TimeToSendNewEmailCodeError } from './errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';
import { SendRecipientPersonCodeUseCase } from './send-recipient-person-code';

let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let emailSender: FakeEmailSender;
let sut: SendRecipientPersonCodeUseCase;

describe('Send Recipient Person Code', () => {
  beforeEach(() => {
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    emailSender = new FakeEmailSender();
    sut = new SendRecipientPersonCodeUseCase(
      recipientPeopleRepository,
      emailSender
    );
  });

  it('should be able to send a verification code to a recipient person', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: null,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson).toBeTruthy();
      expect(result.value.recipientPerson.emailVerification).toBeTruthy();
      expect(result.value.recipientPerson.emailVerification?.code).toBeTruthy();
    }
  });

  it('should send an email with the verification code', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: null,
    });

    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      email: 'recipient@example.com',
    });

    expect(emailSender.sentEmails).toHaveLength(1);
    expect(emailSender.sentEmails[0]).toEqual({
      title: 'Fast Feet sent a code confirmation',
      content: expect.stringContaining('Your new code is'),
      to: 'recipient@example.com',
    });
  });

  it('should update the recipient person with the new verification code', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: null,
    });

    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      email: 'recipient@example.com',
    });

    const updatedRecipientPerson = await recipientPeopleRepository.findByEmail(
      'recipient@example.com'
    );

    expect(updatedRecipientPerson?.emailVerification).toBeTruthy();
    expect(updatedRecipientPerson?.emailVerification?.code).toBeTruthy();
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

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    const oldCode = recipientPerson.emailVerification?.code.code;

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(
        result.value.recipientPerson.emailVerification?.code.code
      ).not.toBe(oldCode);
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

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
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

    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
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

  it('should create and send a code when recipient person has no email verification', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'recipient@example.com',
      emailVerification: null,
    });

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      email: 'recipient@example.com',
    });

    expect(result.isRight()).toBe(true);
    expect(emailSender.sentEmails).toHaveLength(1);

    const updatedRecipientPerson = await recipientPeopleRepository.findByEmail(
      'recipient@example.com'
    );

    expect(updatedRecipientPerson?.emailVerification).toBeTruthy();
  });

  it('should send email to the correct recipient', async () => {
    const recipientPerson = makeRecipientPerson({
      email: 'correct-email@example.com',
      emailVerification: null,
    });

    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      email: 'correct-email@example.com',
    });

    expect(emailSender.sentEmails[0].to).toBe('correct-email@example.com');
  });
});
