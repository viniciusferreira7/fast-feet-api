import { type Either, left, right } from '@/core/either';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import type { EmailSender } from '../email/email-sender';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';
import { TimeToSendNewEmailCodeError } from './errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

export interface SendDeliveryPersonCodeUseCaseRequest {
  email: string;
}

export type SendDeliveryPersonCodeUseCaseResponse = Either<
  | WrongCredentialsError
  | TimeToSendNewEmailCodeError
  | DeliveryPersonProfileIsDisableError,
  { deliveryPerson: DeliveryPerson }
>;

export class SendDeliveryPersonCodeUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository,
    private readonly emailSender: EmailSender
  ) {}

  async execute({
    email,
  }: SendDeliveryPersonCodeUseCaseRequest): Promise<SendDeliveryPersonCodeUseCaseResponse> {
    const deliveryPerson =
      await this.deliveryPeopleRepository.findByEmail(email);

    if (!deliveryPerson) {
      return left(new WrongCredentialsError());
    }

    if (!deliveryPerson?.isActive) {
      return left(new DeliveryPersonProfileIsDisableError());
    }

    if (deliveryPerson?.emailVerification?.code) {
      if (deliveryPerson.emailVerification.isCodeExpired()) {
        deliveryPerson.createNewEmailVerification();

        await this.emailSender.send(
          'Fast Feet sent a code confirmation',
          `Your new code is ${deliveryPerson.emailVerification.code}`,
          deliveryPerson.email
        );

        await this.deliveryPeopleRepository.update(deliveryPerson);

        return right({ deliveryPerson: deliveryPerson });
      } else {
        const timeRestingToCodeExpiredInMinutes =
          deliveryPerson.emailVerification.timeInMinutesToExpireCode();
        return left(
          new TimeToSendNewEmailCodeError(timeRestingToCodeExpiredInMinutes)
        );
      }
    }

    const codeWasCreated = deliveryPerson.createNewEmailVerification();

    if (codeWasCreated && deliveryPerson.emailVerification) {
      await this.emailSender.send(
        'Fast Feet sent a code confirmation',
        `Your new code is ${deliveryPerson.emailVerification.code}`,
        deliveryPerson.email
      );
    }

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson: deliveryPerson });
  }
}
