import { type Either, left, right } from '@/core/either';
import type { AdminPerson } from '../../enterprise/entities/admin-person';
import type { AdminPeopleRepository } from '../repositories/admin-people-repository';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

interface GetByIdAdminPersonUseCaseRequest {
  adminPersonId: string;
  authorId: string;
}

type GetByIdAdminPersonUseCaseResponse = Either<
  ResourceNotFoundError | OnlyAdminCanPerformThisActionError,
  { adminPerson: AdminPerson }
>;

export class GetByIdAdminPersonUseCase {
  constructor(private readonly adminPeopleRepository: AdminPeopleRepository) {}

  async execute({
    adminPersonId,
    authorId,
  }: GetByIdAdminPersonUseCaseRequest): Promise<GetByIdAdminPersonUseCaseResponse> {
    const isSamePersonLookingForThisPerson = adminPersonId === authorId;

    const [adminPerson, author] = await Promise.all([
      this.adminPeopleRepository.findById(adminPersonId),
      !isSamePersonLookingForThisPerson
        ? this.adminPeopleRepository.findById(authorId)
        : Promise.resolve(null),
    ]);

    if (!adminPerson) {
      return left(new ResourceNotFoundError('admin'));
    }

    if (!isSamePersonLookingForThisPerson && !author) {
      return left(new OnlyAdminCanPerformThisActionError());
    }

    return right({ adminPerson });
  }
}
