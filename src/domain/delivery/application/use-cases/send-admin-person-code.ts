import { type Either, left, right } from '@/core/either';
import type { AdminPerson } from '../../enterprise/entities/admin-person';
import type { EmailSender } from '../email/email-sender';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { TimeToSendNewEmailCodeError } from './errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface SendAdminPersonCodeUseCaseRequest {
  email: string;
}

export type SendAdminPersonCodeUseCaseResponse = Either<
  WrongCredentialsError | TimeToSendNewEmailCodeError,
  { adminPerson: AdminPerson }
>;

export class SendAdminPersonCodeUseCase {
  constructor(
    private readonly adminPeopleRepository: AdminPeopleRepository,
    private readonly emailSender: EmailSender
  ) {}

  async execute({
    email,
  }: SendAdminPersonCodeUseCaseRequest): Promise<SendAdminPersonCodeUseCaseResponse> {
    const adminPerson = await this.adminPeopleRepository.findByEmail(email);

    if (!adminPerson) {
      return left(new WrongCredentialsError());
    }

    if (adminPerson?.emailVerification?.code) {
      if (adminPerson.emailVerification.isCodeExpired()) {
        adminPerson.createNewEmailVerification();

        await this.emailSender.send(
          'Fast Feet sent a code confirmation',
          `Your new code is ${adminPerson.emailVerification.code}`,
          adminPerson.email
        );

        await this.adminPeopleRepository.update(adminPerson);

        return right({ adminPerson: adminPerson });
      } else {
        const timeRestingToCodeExpiredInMinutes =
          adminPerson.emailVerification.timeInMinutesToExpireCode();
        return left(
          new TimeToSendNewEmailCodeError(timeRestingToCodeExpiredInMinutes)
        );
      }
    }

    const codeWasCreated = adminPerson.createNewEmailVerification();

    if (codeWasCreated && adminPerson.emailVerification) {
      await this.emailSender.send(
        'Fast Feet sent a code confirmation',
        `Your new code is ${adminPerson.emailVerification.code}`,
        adminPerson.email
      );
    }

    await this.adminPeopleRepository.update(adminPerson);

    return right({ adminPerson: adminPerson });
  }
}
