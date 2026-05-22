import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotAcceptableException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotAcceptableResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { OnlyAdminCanPerformThisActionError } from '@/domain/delivery/application/use-cases/errors/only-admin-can-perform-this-action-error';
import { GetByIdRecipientPersonUseCase } from '@/domain/delivery/application/use-cases/get-by-id-recipient-person';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  getByIdRecipientPersonErrorCounter,
  getByIdRecipientPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { RecipientPersonPresenter } from '../presenters/recipient-person-presenter';

@ApiTags('Recipients')
@ApiBearerAuth('JWT-auth')
@Controller('recipients/:id')
@Role('Admin', 'Recipient')
@UseGuards(RoleGuard)
export class GetByIdRecipientPersonController {
  constructor(
    private readonly getByIdRecipientPersonUseCase: GetByIdRecipientPersonUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a recipient by ID' })
  @ApiParam({ name: 'id', description: 'Recipient person ID', type: 'string' })
  @ApiOkResponse({ description: 'Recipient found' })
  @ApiNotAcceptableResponse({ description: 'Recipient not found' })
  @ApiForbiddenResponse({
    description: 'Requester is not an admin or the recipient themselves',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('id') recipientPersonId: string
  ) {
    const result = await this.getByIdRecipientPersonUseCase.execute({
      recipientPersonId,
      authorId: currentUser.sub,
    });

    if (result.isLeft()) {
      getByIdRecipientPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotAcceptableException(error.message);
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    getByIdRecipientPersonSuccessCounter.add(1);
    const { recipientPerson } = result.value;
    return { recipient: RecipientPersonPresenter.toHttp(recipientPerson) };
  }
}
