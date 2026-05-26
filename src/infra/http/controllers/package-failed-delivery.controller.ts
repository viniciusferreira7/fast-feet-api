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
import { DeliveryWithoutRequiredPhoto } from '@/domain/delivery/application/use-cases/errors/delivery-without-required-photo';
import { PackageNotAssignedToDeliveryPersonError } from '@/domain/delivery/application/use-cases/errors/package-not-assigned-to-delivery-person-error';
import { PackageFailedDeliveryUseCase } from '@/domain/delivery/application/use-cases/package-failed-delivery';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  packageFailedDeliveryErrorCounter,
  packageFailedDeliverySuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const packageFailedDeliverySchema = z.object({
  attachmentId: z.uuid(),
  description: z.string().min(1).max(500).optional(),
});

type PackageFailedDeliverySchema = z.infer<typeof packageFailedDeliverySchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Delivery')
@Controller('packages/:packageId/failed-delivery')
export class PackageFailedDeliveryController {
  constructor(
    private readonly packageFailedDeliveryUseCase: PackageFailedDeliveryUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Mark a package as failed delivery (delivery person only)',
  })
  @ApiParam({ name: 'packageId', description: 'Package ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['attachmentId'],
      properties: {
        attachmentId: {
          type: 'string',
          format: 'uuid',
          description: 'Proof photo attachment ID',
        },
        description: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiOkResponse({ description: 'Package marked as failed delivery' })
  @ApiNotFoundResponse({
    description: 'Package, attachment, or delivery person not found',
  })
  @ApiForbiddenResponse({
    description: 'Delivery person not assigned to this package',
  })
  @ApiBadRequestResponse({
    description: 'Missing photo or invalid status transition',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(packageFailedDeliverySchema))
    body: PackageFailedDeliverySchema
  ) {
    const result = await this.packageFailedDeliveryUseCase.execute({
      packageId,
      deliveryPersonId: currentUser.sub,
      attachmentId: body.attachmentId,
      description: body.description,
    });

    if (result.isLeft()) {
      packageFailedDeliveryErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case DeliveryWithoutRequiredPhoto:
          throw new BadRequestException(error.message);
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

    packageFailedDeliverySuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
