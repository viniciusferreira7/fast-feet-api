import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { FetchManyNotificationsUseCase } from '@/domain/notification/application/use-cases/fetch-many-notifications';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  fetchManyNotificationsErrorCounter,
  fetchManyNotificationsSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { NotificationPresenter } from '../presenters/notification-presenter';

const fetchManyNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  created_at_gte: z.coerce.date().optional(),
});

type FetchManyNotificationsSchema = z.infer<
  typeof fetchManyNotificationsSchema
>;

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@Role('Admin', 'Delivery', 'Recipient')
@UseGuards(RoleGuard)
export class FetchManyNotificationsController {
  constructor(
    private readonly fetchManyNotificationsUseCase: FetchManyNotificationsUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Fetch notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'created_at_gte',
    required: false,
    type: String,
    description:
      'Filter notifications created at or after this date (ISO 8601)',
  })
  @ApiOkResponse({ description: 'List of notifications for the current user' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Query(new ZodValidationPipe(fetchManyNotificationsSchema))
    query: FetchManyNotificationsSchema
  ) {
    const result = await this.fetchManyNotificationsUseCase.execute({
      authorId: currentUser.sub,
      page: query.page,
      perPage: query.per_page,
      search: query.search,
      createdAtGte: query.created_at_gte,
    });

    if (result.isLeft()) {
      fetchManyNotificationsErrorCounter.add(1);
      const error = result.value;
      throw new BadRequestException(error.message);
    }

    fetchManyNotificationsSuccessCounter.add(1);
    const { notifications } = result.value;

    return {
      page: notifications.page,
      total_pages: notifications.totalPages,
      per_page: notifications.perPage,
      notifications: notifications.result.map(NotificationPresenter.toHttp),
    };
  }
}
