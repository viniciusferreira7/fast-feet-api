import { type INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';
import {
  type RegisterRecipientOptions,
  createAuthenticatedRecipientPerson,
  registerRecipientPerson,
  sendRecipientCode,
  getRecipientEmailCode,
  validateRecipientCode,
  loginRecipientPerson,
} from 'test/e2e/recipient-flow';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { notifications } from '@/infra/database/drizzle/schema';

export interface RecipientWithId {
  recipientId: string;
  email: string;
  cpf: string;
  password: string;
  accessToken: string;
}

/**
 * Registers and fully authenticates a recipient, returning both the
 * recipientId (from the registration response body) and the JWT accessToken.
 */
export async function createAuthenticatedRecipientWithId(
  app: INestApplication,
  drizzleService: DrizzleService,
  apiToken: string,
  options: RegisterRecipientOptions = {}
): Promise<RecipientWithId> {
  const { response, email, cpf, password } = await registerRecipientPerson(
    app,
    apiToken,
    options
  );

  const recipientId = response.body.recipient.id as string;

  await sendRecipientCode(app, email, apiToken);
  const code = await getRecipientEmailCode(drizzleService, email);
  await validateRecipientCode(app, email, code, apiToken);
  const accessToken = await loginRecipientPerson(app, cpf, password, apiToken);

  return { recipientId, email, cpf, password, accessToken };
}

export interface SeedNotificationOptions {
  recipientId: string;
  title?: string;
  content?: string;
  readAt?: Date | null;
}

export async function seedNotification(
  drizzleService: DrizzleService,
  options: SeedNotificationOptions
): Promise<string> {
  const [row] = await drizzleService.db
    .insert(notifications)
    .values({
      recipientId: options.recipientId,
      title: options.title ?? 'Test Notification',
      content: options.content ?? 'Test notification content.',
      readAt: options.readAt ?? null,
    })
    .returning({ id: notifications.id });

  return row.id;
}

export interface FetchNotificationsQuery {
  page?: number;
  per_page?: number;
  search?: string;
  created_at_gte?: string;
}

export async function fetchNotifications(
  app: INestApplication,
  token: string,
  query: FetchNotificationsQuery = {}
): Promise<Response> {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.per_page !== undefined)
    params.set('per_page', String(query.per_page));
  if (query.search !== undefined) params.set('search', query.search);
  if (query.created_at_gte !== undefined)
    params.set('created_at_gte', query.created_at_gte);

  const qs = params.toString();

  return request(app.getHttpServer())
    .get(`/notifications${qs ? `?${qs}` : ''}`)
    .set('Authorization', `Bearer ${token}`);
}

export async function markAsReadNotification(
  app: INestApplication,
  token: string,
  notificationId: string
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/notifications/${notificationId}/read`)
    .set('Authorization', `Bearer ${token}`);
}

export interface MarkManyBody {
  notifications_ids?: string[];
  mark_all?: boolean;
}

export async function markManyNotificationsAsRead(
  app: INestApplication,
  token: string,
  body: MarkManyBody
): Promise<Response> {
  return request(app.getHttpServer())
    .patch('/notifications/read')
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}
