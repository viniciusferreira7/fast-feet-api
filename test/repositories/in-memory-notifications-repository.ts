import { Pagination } from '@/core/entities/value-object/pagination';
import type {
  FindManyNotificationsParams,
  NotificationsRepository,
} from '@/domain/notification/application/repositories/notifications-repository';
import type { Notification } from '@/domain/notification/enterprise/entities/notification';

export class InMemoryNotificationsRepository
  implements NotificationsRepository
{
  public items: Notification[] = [];

  async findManyByAuthorId(
    params: FindManyNotificationsParams
  ): Promise<Pagination<Notification>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 10;

    let filtered = this.items.filter(
      (item) => item.recipientId.toString() === params.authorId
    );

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.content.toLowerCase().includes(search)
      );
    }

    if (params.isRead !== undefined) {
      filtered = filtered.filter((item) =>
        params.isRead ? item.readAt != null : item.readAt == null
      );
    }

    if (params.createdAtGte) {
      const createdAtGte = params.createdAtGte;
      filtered = filtered.filter((item) => item.createdAt >= createdAtGte);
    }

    const startIndex = (page - 1) * perPage;
    const paginated = filtered.slice(startIndex, startIndex + perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    return Pagination.create<Notification>({
      page,
      perPage,
      totalPages,
      result: paginated,
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = this.items.find((item) => item.id.toString() === id);

    return notification ?? null;
  }

  async findByIdAndAuthorId(
    authorId: string,
    notificationId: string
  ): Promise<Notification | null> {
    const notification = this.items.find(
      (item) =>
        item.id.toString() === notificationId &&
        item.recipientId.toString() === authorId
    );

    return notification ?? null;
  }

  async create(notification: Notification): Promise<void> {
    this.items.push(notification);
  }

  async save(notification: Notification): Promise<void> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === notification.id.toString()
    );

    if (itemIndex >= 0) {
      this.items[itemIndex] = notification;
    }
  }
}
