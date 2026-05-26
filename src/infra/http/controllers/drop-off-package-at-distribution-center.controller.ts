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
import { DropOffPackageAtDistributionCenterUseCase } from '@/domain/delivery/application/use-cases/drop-off-package-at-distribution-center';
import { DeliveryPersonNotAssignedToPackageError } from '@/domain/delivery/application/use-cases/errors/delivery-person-not-assigned-to-package-error';
import { PackageNotAssignedToDeliveryPersonError } from '@/domain/delivery/application/use-cases/errors/package-not-assigned-to-delivery-person-error';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  dropOffPackageAtDistributionCenterErrorCounter,
  dropOffPackageAtDistributionCenterSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const dropOffSchema = z.object({
  description: z.string().min(1).max(500).optional(),
});

type DropOffSchema = z.infer<typeof dropOffSchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Delivery')
@Controller('packages/:packageId/drop-off')
export class DropOffPackageAtDistributionCenterController {
  constructor(
    private readonly dropOffPackageUseCase: DropOffPackageAtDistributionCenterUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Drop off a package at distribution center (delivery person only)',
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
  @ApiOkResponse({ description: 'Package dropped off at distribution center' })
  @ApiNotFoundResponse({ description: 'Package or delivery person not found' })
  @ApiForbiddenResponse({
    description: 'Delivery person not assigned to this package',
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(dropOffSchema))
    body: DropOffSchema
  ) {
    const result = await this.dropOffPackageUseCase.execute({
      packageId,
      deliveryPersonId: currentUser.sub,
      description: body.description,
    });

    if (result.isLeft()) {
      dropOffPackageAtDistributionCenterErrorCounter.add(1);
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

    dropOffPackageAtDistributionCenterSuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
