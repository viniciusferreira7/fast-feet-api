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
import { OnlyAdminCanPerformThisActionError } from '@/domain/delivery/application/use-cases/errors/only-admin-can-perform-this-action-error';
import { PackageIsOutForDeliveryUseCase } from '@/domain/delivery/application/use-cases/package-is-out-for-delivery';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  packageIsOutForDeliveryErrorCounter,
  packageIsOutForDeliverySuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const packageIsOutForDeliverySchema = z.object({
  deliveryPersonId: z.uuid(),
  description: z.string().min(1).max(500).optional(),
});

type PackageIsOutForDeliverySchema = z.infer<
  typeof packageIsOutForDeliverySchema
>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Admin')
@Controller('packages/:packageId/out-for-delivery')
export class PackageIsOutForDeliveryController {
  constructor(
    private readonly packageIsOutForDeliveryUseCase: PackageIsOutForDeliveryUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a package as out for delivery (admin only)' })
  @ApiParam({ name: 'packageId', description: 'Package ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['deliveryPersonId'],
      properties: {
        deliveryPersonId: { type: 'string', format: 'uuid' },
        description: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiOkResponse({ description: 'Package marked as out for delivery' })
  @ApiNotFoundResponse({ description: 'Package or delivery person not found' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(packageIsOutForDeliverySchema))
    body: PackageIsOutForDeliverySchema
  ) {
    const result = await this.packageIsOutForDeliveryUseCase.execute({
      authorId: currentUser.sub,
      deliveryPersonId: body.deliveryPersonId,
      packageId,
      description: body.description,
    });

    if (result.isLeft()) {
      packageIsOutForDeliveryErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case InvalidatePackageStatusError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    packageIsOutForDeliverySuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
