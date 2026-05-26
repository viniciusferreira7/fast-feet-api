import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InvalidMarkAsReadRequestError } from '@/domain/notification/application/use-cases/error/invalid-mark-as-read-request-error';
import { MarkManyNotificationsAsReaUseCase } from '@/domain/notification/application/use-cases/mark-many-notifications-as-read';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  markManyNotificationsAsReadErrorCounter,
  markManyNotificationsAsReadSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const markManyNotificationsAsReadSchema = z
  .object({
    notifications_ids: z.array(z.uuid()).min(2).optional(),
    mark_all: z.boolean().optional(),
  })
  .refine((data) => data.notifications_ids || data.mark_all, {
    message:
      'Please select the notifications you want to mark as read or choose to mark all.',
  });

type MarkManyNotificationsAsReadSchema = z.infer<
  typeof markManyNotificationsAsReadSchema
>;

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications/read')
@Role('Admin', 'Delivery', 'Recipient')
@UseGuards(RoleGuard)
export class MarkManyNotificationsAsReadController {
  constructor(
    private readonly markManyNotificationsAsReaUseCase: MarkManyNotificationsAsReaUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notifications_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          minItems: 2,
          description: 'IDs of the notifications to mark as read (min 2)',
          example: [
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          ],
        },
        mark_all: {
          type: 'boolean',
          description: 'If true, marks all notifications as read',
          example: false,
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Notifications marked as read' })
  @ApiNotFoundResponse({ description: 'Author not found' })
  @ApiBadRequestResponse({
    description: 'Neither notifications_ids nor mark_all was provided',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(markManyNotificationsAsReadSchema))
    body: MarkManyNotificationsAsReadSchema
  ) {
    const result = await this.markManyNotificationsAsReaUseCase.execute({
      authorId: currentUser.sub,
      notificationsIds: body.notifications_ids,
      markAll: body.mark_all,
    });

    if (result.isLeft()) {
      markManyNotificationsAsReadErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case InvalidMarkAsReadRequestError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    markManyNotificationsAsReadSuccessCounter.add(1);

    return { message: result.value.message };
  }
}
