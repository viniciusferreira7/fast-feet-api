import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';

interface ValidDeliveryPersonUseCaseRequest {
  code: string;
  email: string;
}

type ValidDeliveryPersonUseCaseResponse = Either<
  | ResourceNotFoundError
  | EmailCodeExpiredError
  | InvalidEmailCodeError
  | DeliveryPersonProfileIsDisableError,
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

    if (!deliveryPerson?.isActive) {
      return left(new DeliveryPersonProfileIsDisableError());
    }

    if (deliveryPerson.emailVerification?.isCodeExpired()) {
      return left(new EmailCodeExpiredError());
    }

    if (!deliveryPerson.emailVerification?.validateCode(code)) {
      return left(new InvalidEmailCodeError());
    }

    deliveryPerson.markEmailAsValidated();

    await this.deliveryPeopleRepository.update(deliveryPerson);

    return right({ deliveryPerson });
  }
}
