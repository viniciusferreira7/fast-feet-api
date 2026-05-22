import type { Notification } from '@/domain/notification/enterprise/entities/notification';

export interface NotificationPresenterToHttp {
  id: string;
  recipient_id: string;
  title: string;
  content: string;
  read_at: Date | null;
  created_at: Date;
}

export class NotificationPresenter {
  public static toHttp(
    notification: Notification
  ): NotificationPresenterToHttp {
    return {
      id: notification.id.toString(),
      recipient_id: notification.recipientId.toString(),
      title: notification.title,
      content: notification.content,
      read_at: notification.readAt ?? null,
      created_at: notification.createdAt,
    };
  }
}
