import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  type SQL,
} from 'drizzle-orm';
import { Pagination } from '@/core/entities/value-object/pagination';
import {
  type FindManyNotificationsParams,
  NotificationsRepository,
} from '@/domain/notification/application/repositories/notifications-repository';
import type { Notification } from '@/domain/notification/enterprise/entities/notification';
import { DrizzleService } from '../drizzle.service';
import { DrizzleNotificationMapper } from '../mappers/drizzle-notification-mapper';
import { notifications } from '../schema';

@Injectable()
export class DrizzleNotificationsRepository implements NotificationsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async create(notification: Notification): Promise<void> {
    const raw = DrizzleNotificationMapper.toPersistence(notification);

    await this.drizzleService.db.insert(notifications).values(raw);
  }

  public async findById(id: string): Promise<Notification | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    if (!row) return null;

    return DrizzleNotificationMapper.toDomain(row);
  }

  public async findByIdAndAuthorId(
    authorId: string,
    notificationId: string
  ): Promise<Notification | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientId, authorId)
        )
      );

    if (!row) return null;

    return DrizzleNotificationMapper.toDomain(row);
  }

  public async findManyByAuthorId(
    params: FindManyNotificationsParams
  ): Promise<Pagination<Notification>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const offset = (page - 1) * perPage;

    const conditions: SQL<unknown>[] = [
      eq(notifications.recipientId, params.authorId),
    ];

    if (params.isRead === true)
      conditions.push(isNotNull(notifications.readAt));
    if (params.isRead === false) conditions.push(isNull(notifications.readAt));
    if (params.search)
      conditions.push(ilike(notifications.title, `%${params.search}%`));
    if (params.createdAtGte)
      conditions.push(gte(notifications.createdAt, params.createdAtGte));

    const orderMap: Record<string, SQL<unknown>> = {
      name: asc(notifications.title),
      '-name': desc(notifications.title),
      content: asc(notifications.content),
      '-content': desc(notifications.content),
      created_at: asc(notifications.createdAt),
      '-created_at': desc(notifications.createdAt),
      read_at: asc(notifications.readAt),
      '-read_at': desc(notifications.readAt),
    };

    const orderBy = params.order
      ? orderMap[params.order]
      : desc(notifications.createdAt);
    const whereClause = and(...conditions);

    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(notifications)
      .where(whereClause);

    const rows = await this.drizzleService.db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(perPage)
      .offset(offset);

    return Pagination.create({
      page,
      perPage,
      totalPages: Math.ceil(Number(total) / perPage),
      result: rows.map(DrizzleNotificationMapper.toDomain),
    });
  }

  public async save(notification: Notification): Promise<void> {
    const raw = DrizzleNotificationMapper.toPersistence(notification);

    await this.drizzleService.db
      .update(notifications)
      .set({ readAt: raw.readAt, version: raw.version })
      .where(eq(notifications.id, raw.id));
  }

  public async updateManyByIdAndAuthorId(authorId: string): Promise<boolean> {
    await this.drizzleService.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientId, authorId),
          isNull(notifications.readAt)
        )
      );

    return true;
  }

  public async markAllNotificationAsRead(authorId: string): Promise<boolean> {
    await this.drizzleService.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.recipientId, authorId));

    return true;
  }
}
