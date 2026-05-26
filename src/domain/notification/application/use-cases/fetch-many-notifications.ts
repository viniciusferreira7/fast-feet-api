import { Injectable } from '@nestjs/common';
import { type Either, right } from '@/core/either';
import { Pagination } from '@/core/entities/value-object/pagination';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { Notification } from '../../enterprise/entities/notification';
import { NotificationsRepository } from '../repositories/notifications-repository';

interface FetchManyNotificationsUseCaseRequest {
  authorId: string;
  search?: string;
  createdAtGte?: Date;
  page?: number;
  perPage?: number;
}

type FetchManyNotificationsUseCaseResponse = Either<
  ResourceNotFoundError,
  { notifications: Pagination<Notification> }
>;

@Injectable()
export class FetchManyNotificationsUseCase {
  constructor(
    private readonly notificationsRepository: NotificationsRepository
  ) {}

  async execute({
    authorId,
    ...params
  }: FetchManyNotificationsUseCaseRequest): Promise<FetchManyNotificationsUseCaseResponse> {
    const notifications = await this.notificationsRepository.findManyByAuthorId(
      {
        authorId,
        ...params,
      }
    );

    return right({ notifications });
  }
}
