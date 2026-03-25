import type { Pagination } from '@/core/entities/value-object/pagination';
import type { Notification } from '@/domain/notification/enterprise/entities/notification';

export interface FindManyNotificationsParams {
  authorId: string;
  search?: string;
  isRead?: boolean;
  createdAtGte?: Date;
  page?: number;
  perPage?: number;
  order?:
    | 'created_at'
    | '-created_at'
    | 'read_at'
    | '-read_at'
    | 'name'
    | '-name'
    | 'content'
    | '-content';
}
export abstract class NotificationsRepository {
  abstract findManyByAuthorId(
    params: FindManyNotificationsParams
  ): Promise<Pagination<Notification>>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract findByIdAndAuthorId(
    authorId: string,
    notificationId: string
  ): Promise<Notification | null>;
  abstract create(notification: Notification): Promise<void>;
  abstract save(notification: Notification): Promise<void>;
}
