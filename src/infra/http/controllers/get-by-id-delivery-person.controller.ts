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
import { GetByIdDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/get-by-id-delivery-person';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  getByIdDeliveryPersonErrorCounter,
  getByIdDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { DeliveryPersonPresenter } from '../presenters/delivery-person-presenter';

@ApiTags('Delivery People')
@ApiBearerAuth('JWT-auth')
@Controller('delivery-people/:id')
@Role('Admin', 'Delivery')
@UseGuards(RoleGuard)
export class GetByIdDeliveryPersonController {
  constructor(
    private readonly getByIdDeliveryPersonUseCase: GetByIdDeliveryPersonUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a delivery person by ID' })
  @ApiParam({ name: 'id', description: 'Delivery person ID', type: 'string' })
  @ApiOkResponse({ description: 'Delivery person found' })
  @ApiNotAcceptableResponse({ description: 'Delivery person not found' })
  @ApiForbiddenResponse({
    description: 'Requester is not an admin or the delivery person themselves',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('id') deliveryPersonId: string
  ) {
    const result = await this.getByIdDeliveryPersonUseCase.execute({
      deliveryPersonId,
      authorId: currentUser.sub,
    });

    if (result.isLeft()) {
      getByIdDeliveryPersonErrorCounter.add(1);
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

    getByIdDeliveryPersonSuccessCounter.add(1);
    const { deliveryPerson } = result.value;
    return { delivery_person: DeliveryPersonPresenter.toHttp(deliveryPerson) };
  }
}
