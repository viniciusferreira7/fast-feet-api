import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { CannotDisableDeliveryPersonWithActivePackagesError } from '@/domain/delivery/application/use-cases/errors/cannot-disable-delivery-person-with-active-packages-error';
import { OnlyAdminCanPerformThisActionError } from '@/domain/delivery/application/use-cases/errors/only-admin-can-perform-this-action-error';
import { DeleteDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/delete-delivery-person';
import { DeliveryPersonAlreadyDisabledError } from '@/domain/delivery/errors/delivery-person-already-disabled-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  deleteDeliveryPersonErrorCounter,
  deleteDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';

@ApiTags('Delivery People')
@ApiBearerAuth('JWT-auth')
@Controller('delivery-people/cpf/:cpf')
@Role('Admin')
@UseGuards(RoleGuard)
export class DeleteDeliveryPersonController {
  constructor(
    private readonly deleteDeliveryPersonUseCase: DeleteDeliveryPersonUseCase
  ) {}

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Disable (soft-delete) a delivery person by CPF' })
  @ApiParam({ name: 'cpf', description: 'Delivery person CPF', type: 'string' })
  @ApiNoContentResponse({ description: 'Delivery person disabled successfully' })
  @ApiBadRequestResponse({
    description: 'Delivery person not found or already disabled',
  })
  @ApiConflictResponse({
    description: 'Cannot disable delivery person with active packages',
  })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('cpf') cpf: string
  ) {
    const result = await this.deleteDeliveryPersonUseCase.execute({
      authorId: currentUser.sub,
      cpf,
    });

    if (result.isLeft()) {
      deleteDeliveryPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        case DeliveryPersonAlreadyDisabledError:
          throw new BadRequestException(error.message);
        case CannotDisableDeliveryPersonWithActivePackagesError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    deleteDeliveryPersonSuccessCounter.add(1);
  }
}
