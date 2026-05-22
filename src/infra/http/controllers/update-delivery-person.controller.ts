import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DeliveryPersonProfileIsDisableError } from '@/domain/delivery/application/use-cases/errors/delivery-person-profile-is-disable-error';
import { EmailAlreadyInUseError } from '@/domain/delivery/application/use-cases/errors/email-already-in-use-error';
import { UpdateDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/update-delivery-person';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  updateDeliveryPersonErrorCounter,
  updateDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { DeliveryPersonPresenter } from '../presenters/delivery-person-presenter';

const updateDeliveryPersonSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
});

type UpdateDeliveryPersonSchema = z.infer<typeof updateDeliveryPersonSchema>;

@ApiTags('Delivery People')
@ApiBearerAuth('JWT-auth')
@Controller('delivery-people')
@Role('Delivery')
@UseGuards(RoleGuard)
export class UpdateDeliveryPersonController {
  constructor(
    private readonly updateDeliveryPersonUseCase: UpdateDeliveryPersonUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Update the authenticated delivery person name and/or email',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Delivery person updated successfully' })
  @ApiBadRequestResponse({
    description: 'Delivery person not found or profile disabled',
  })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiForbiddenResponse({ description: 'Requester is not a delivery person' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(updateDeliveryPersonSchema))
    body: UpdateDeliveryPersonSchema
  ) {
    const result = await this.updateDeliveryPersonUseCase.execute({
      id: currentUser.sub,
      name: body.name,
      email: body.email,
    });

    if (result.isLeft()) {
      updateDeliveryPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case EmailAlreadyInUseError:
          throw new ConflictException(error.message);
        case DeliveryPersonProfileIsDisableError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const { deliveryPerson } = result.value;
    updateDeliveryPersonSuccessCounter.add(1);
    return { delivery_person: DeliveryPersonPresenter.toHttp(deliveryPerson) };
  }
}
