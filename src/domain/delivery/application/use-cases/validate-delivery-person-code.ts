import { type Either, left, right } from '@/core/either';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { EmailCodeHasNotBeenVerifiedError } from './errors/email-code-has-not-been-verified-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface ValidDeliveryPersonUseCaseRequest {
  code: string;
  email: string;
}

type ValidDeliveryPersonUseCaseResponse = Either<
  | ResourceNotFoundError
  | EmailCodeExpiredError
  | InvalidEmailCodeError
  | EmailCodeHasNotBeenVerifiedError,
  { deliveryPerson: DeliveryPerson }
>;

export class ValidDeliveryPersonUseCase {
  constructor(
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository
  ) {}

  async execute({
    code,
    email,
  }: ValidDeliveryPersonUseCaseRequest): Promise<ValidDeliveryPersonUseCaseResponse> {
    const deliveryPerson =
      await this.deliveryPeopleRepository.findByEmail(email);

    if (!deliveryPerson) {
      return left(new ResourceNotFoundError('delivery'));
    }

    if (deliveryPerson.emailVerification?.isCodeExpired()) {
      return left(new EmailCodeExpiredError());
    }

    if (!deliveryPerson.emailVerification?.validateCode(code)) {
      return left(new InvalidEmailCodeError());
    }

    if (!deliveryPerson.isEmailValidated) {
      return left(new EmailCodeHasNotBeenVerifiedError());
    }

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson });
  }
}
