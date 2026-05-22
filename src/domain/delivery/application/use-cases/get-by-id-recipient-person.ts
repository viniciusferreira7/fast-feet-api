import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { RecipientPeopleRepository } from '../repositories/recipient-people-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';

interface GetByIdRecipientPersonUseCaseRequest {
  recipientPersonId: string;
  authorId: string;
}

type GetByIdRecipientPersonUseCaseResponse = Either<
  ResourceNotFoundError | OnlyAdminCanPerformThisActionError,
  { recipientPerson: RecipientPerson }
>;

@Injectable()
export class GetByIdRecipientPersonUseCase {
  constructor(
    private readonly recipientPeopleRepository: RecipientPeopleRepository,
    private readonly adminPeopleRepository: AdminPeopleRepository
  ) {}

  async execute({
    recipientPersonId,
    authorId,
  }: GetByIdRecipientPersonUseCaseRequest): Promise<GetByIdRecipientPersonUseCaseResponse> {
    const isSamePersonLookingForThisPerson = recipientPersonId === authorId;

    const [recipientPerson, author] = await Promise.all([
      this.recipientPeopleRepository.findById(recipientPersonId),
      !isSamePersonLookingForThisPerson
        ? this.adminPeopleRepository.findById(authorId)
        : Promise.resolve(null),
    ]);

    if (!recipientPerson) {
      return left(new ResourceNotFoundError('recipient person'));
    }

    if (!isSamePersonLookingForThisPerson && !author) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    return right({ recipientPerson });
  }
}
