import { FakeEmailSender } from 'test/email/fake-email-sender';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { EmailVerification } from '../../enterprise/entities/email-verification';
import { TimeToSendNewEmailCodeError } from './errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';
import { SendAdminPersonCodeUseCase } from './send-admin-person-code';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let emailSender: FakeEmailSender;
let sut: SendAdminPersonCodeUseCase;

describe('Send Admin Person Code', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    emailSender = new FakeEmailSender();
    sut = new SendAdminPersonCodeUseCase(adminPeopleRepository, emailSender);
  });

  it('should be able to send a verification code to an admin person', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: null,
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson).toBeTruthy();
      expect(result.value.adminPerson.emailVerification).toBeTruthy();
      expect(result.value.adminPerson.emailVerification?.code).toBeTruthy();
    }
  });

  it('should send an email with the verification code', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: null,
    });

    await adminPeopleRepository.register(adminPerson);

    await sut.execute({
      email: 'admin@example.com',
    });

    expect(emailSender.sentEmails).toHaveLength(1);
    expect(emailSender.sentEmails[0]).toEqual({
      title: 'Fast Feet sent a code confirmation',
      content: expect.stringContaining('Your new code is'),
      to: 'admin@example.com',
    });
  });

  it('should update the admin person with the new verification code', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: null,
    });

    await adminPeopleRepository.register(adminPerson);

    await sut.execute({
      email: 'admin@example.com',
    });

    const updatedAdminPerson =
      await adminPeopleRepository.findByEmail('admin@example.com');

    expect(updatedAdminPerson?.emailVerification).toBeTruthy();
    expect(updatedAdminPerson?.emailVerification?.code).toBeTruthy();
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

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    const oldCode = adminPerson.emailVerification?.code.code;

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.emailVerification?.code.code).not.toBe(
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

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
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

    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: emailVerificationResult.value,
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
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

  it('should create and send a code when admin person has no email verification', async () => {
    const adminPerson = makeAdminPerson({
      email: 'admin@example.com',
      emailVerification: null,
    });

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      email: 'admin@example.com',
    });

    expect(result.isRight()).toBe(true);
    expect(emailSender.sentEmails).toHaveLength(1);

    const updatedAdminPerson =
      await adminPeopleRepository.findByEmail('admin@example.com');

    expect(updatedAdminPerson?.emailVerification).toBeTruthy();
  });

  it('should send email to the correct recipient', async () => {
    const adminPerson = makeAdminPerson({
      email: 'correct-email@example.com',
      emailVerification: null,
    });

    await adminPeopleRepository.register(adminPerson);

    await sut.execute({
      email: 'correct-email@example.com',
    });

    expect(emailSender.sentEmails[0].to).toBe('correct-email@example.com');
  });
});
