import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { Notification } from '../../enterprise/entities/notification';
import { NotificationsRepository } from '../repositories/notifications-repository';

interface MarkAsReadNotificationUseCaseRequest {
  authorId: string;
  notificationId: string;
}

type MarkAsReadNotificationUseCaseResponse = Either<
  ResourceNotFoundError,
  { notification: Notification }
>;

@Injectable()
export class MarkAsReadNotificationUseCase {
  constructor(
    private readonly notificationsRepository: NotificationsRepository
  ) {}

  async execute({
    authorId,
    notificationId,
  }: MarkAsReadNotificationUseCaseRequest): Promise<MarkAsReadNotificationUseCaseResponse> {
    const notification = await this.notificationsRepository.findByIdAndAuthorId(
      authorId,
      notificationId
    );

    if (!notification) {
      return left(new ResourceNotFoundError('notification'));
    }

    notification.read();

    await this.notificationsRepository.save(notification);

    return right({ notification });
  }
}
