import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DeliveryPersonNotAssignedToPackageError } from '@/domain/delivery/application/use-cases/errors/delivery-person-not-assigned-to-package-error';
import { PackageNotAssignedToDeliveryPersonError } from '@/domain/delivery/application/use-cases/errors/package-not-assigned-to-delivery-person-error';
import { ReturnPackageUseCase } from '@/domain/delivery/application/use-cases/return-package';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  returnPackageErrorCounter,
  returnPackageSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const returnPackageSchema = z.object({
  description: z.string().min(1).max(500).optional(),
});

type ReturnPackageSchema = z.infer<typeof returnPackageSchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Delivery')
@Controller('packages/:packageId/return')
export class ReturnPackageController {
  constructor(private readonly returnPackageUseCase: ReturnPackageUseCase) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Mark a package as returned (delivery person only)',
  })
  @ApiParam({ name: 'packageId', description: 'Package ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiOkResponse({ description: 'Package returned successfully' })
  @ApiNotFoundResponse({ description: 'Package or delivery person not found' })
  @ApiForbiddenResponse({
    description: 'Delivery person not assigned to this package',
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(returnPackageSchema))
    body: ReturnPackageSchema
  ) {
    const result = await this.returnPackageUseCase.execute({
      packageId,
      deliveryPersonId: currentUser.sub,
      description: body.description,
    });

    if (result.isLeft()) {
      returnPackageErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case DeliveryPersonNotAssignedToPackageError:
          throw new ForbiddenException(error.message);
        case PackageNotAssignedToDeliveryPersonError:
          throw new BadRequestException(error.message);
        case InvalidatePackageStatusError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    returnPackageSuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
