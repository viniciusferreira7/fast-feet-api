import { type Either, left, right } from '@/core/either';
import type { RecipientPerson } from '../../enterprise/entities/recipient-person';
import type { EmailSender } from '../email/email-sender';
import type { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { TimeToSendNewEmailCodeError } from './errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface SendRecipientPersonCodeUseCaseRequest {
  email: string;
}

export type SendRecipientPersonCodeUseCaseResponse = Either<
  WrongCredentialsError | TimeToSendNewEmailCodeError,
  { recipientPerson: RecipientPerson }
>;

export class SendRecipientPersonCodeUseCase {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly emailSender: EmailSender
  ) {}

  async execute({
    email,
  }: SendRecipientPersonCodeUseCaseRequest): Promise<SendRecipientPersonCodeUseCaseResponse> {
    const recipientPerson =
      await this.recipientPeopleRepository.findByEmail(email);

    if (!recipientPerson) {
      return left(new WrongCredentialsError());
    }

    if (recipientPerson?.emailVerification?.code) {
      if (recipientPerson.emailVerification.isCodeExpired()) {
        recipientPerson.createNewEmailVerification();

        await this.emailSender.send(
          'Fast Feet sent a code confirmation',
          `Your new code is ${recipientPerson.emailVerification.code}`,
          recipientPerson.email
        );

        await this.recipientPeopleRepository.update(recipientPerson);

        return right({ recipientPerson: recipientPerson });
      } else {
        const timeRestingToCodeExpiredInMinutes =
          recipientPerson.emailVerification.timeInMinutesToExpireCode();
        return left(
          new TimeToSendNewEmailCodeError(timeRestingToCodeExpiredInMinutes)
        );
      }
    }

    const codeWasCreated = recipientPerson.createNewEmailVerification();

    if (codeWasCreated && recipientPerson.emailVerification) {
      await this.emailSender.send(
        'Fast Feet sent a code confirmation',
        `Your new code is ${recipientPerson.emailVerification.code}`,
        recipientPerson.email
      );
    }

    await this.recipientPeopleRepository.update(recipientPerson);

    return right({ recipientPerson: recipientPerson });
  }
}
