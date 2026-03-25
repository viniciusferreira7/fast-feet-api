import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { NotificationsRepository } from '../repositories/notifications-repository';
import { InvalidMarkAsReadRequestError } from './error/invalid-mark-as-read-request-error';

interface MarkManyNotificationsAsReaUseCaseRequest {
  authorId: string;
  /**
   * When provided, only the specified notifications will be marked as read.
   */
  notificationsIds?: string[];

  /**
   * If true, marks all notifications as read.
   */
  markAll?: boolean;
}

type MarkManyNotificationsAsReaUseCaseResponse = Either<
  ResourceNotFoundError | InvalidMarkAsReadRequestError,
  { message: 'Notifications marked as read' }
>;

export class MarkManyNotificationsAsReaUseCase {
  constructor(
    private readonly notificationsRepository: NotificationsRepository
  ) {}

  async execute({
    authorId,
    notificationsIds,
    markAll,
  }: MarkManyNotificationsAsReaUseCaseRequest): Promise<MarkManyNotificationsAsReaUseCaseResponse> {
    if (markAll) {
      const result =
        await this.notificationsRepository.markAllNotificationAsRead(authorId);

      if (!result) {
        return left(new ResourceNotFoundError('author'));
      }

      return right({ message: 'Notifications marked as read' });
    }

    if (notificationsIds && notificationsIds?.length > 1) {
      const result =
        await this.notificationsRepository.updateManyByIdAndAuthorId(authorId);

      if (!result) {
        return left(new ResourceNotFoundError('author'));
      }

      return right({ message: 'Notifications marked as read' });
    }

    return left(new InvalidMarkAsReadRequestError());
  }
}
