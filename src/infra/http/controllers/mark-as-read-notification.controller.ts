import {
  BadRequestException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { MarkAsReadNotificationUseCase } from '@/domain/notification/application/use-cases/mark-as-read-notification';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  markAsReadNotificationErrorCounter,
  markAsReadNotificationSuccessCounter,
} from '@/infra/observability/metrics';
import { NotificationPresenter } from '../presenters/notification-presenter';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications/:notificationId/read')
@Role('Admin', 'Delivery', 'Recipient')
@UseGuards(RoleGuard)
export class MarkAsReadNotificationController {
  constructor(
    private readonly markAsReadNotificationUseCase: MarkAsReadNotificationUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({
    name: 'notificationId',
    description: 'ID of the notification to mark as read',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Notification marked as read' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('notificationId') notificationId: string
  ) {
    const result = await this.markAsReadNotificationUseCase.execute({
      authorId: currentUser.sub,
      notificationId,
    });

    if (result.isLeft()) {
      markAsReadNotificationErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    markAsReadNotificationSuccessCounter.add(1);
    const { notification } = result.value;

    return { notification: NotificationPresenter.toHttp(notification) };
  }
}
