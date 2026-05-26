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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { CancelPackageUseCase } from '@/domain/delivery/application/use-cases/cancel-package';
import { OnlyAdminCanPerformThisActionError } from '@/domain/delivery/application/use-cases/errors/only-admin-can-perform-this-action-error';
import { PackageAlreadyCanceledErrorError } from '@/domain/delivery/application/use-cases/errors/package-already-canceled-error';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  cancelPackageErrorCounter,
  cancelPackageSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const cancelPackagesSchema = z.object({
  description: z.string().min(10).max(500).optional(),
});

type CancelPackagesSchema = z.infer<typeof cancelPackagesSchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Admin')
@Controller('packages/:packageId/cancel')
export class CancelPackageController {
  constructor(private readonly cancelPackageUseCase: CancelPackageUseCase) {}

  @Patch()
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancel a package (admin only)' })
  @ApiParam({ name: 'packageId', description: 'Package ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          minLength: 10,
          maxLength: 500,
          description: 'Optional reason for cancellation',
        },
      },
    },
  })
  @ApiNoContentResponse({ description: 'Package cancelled successfully' })
  @ApiNotFoundResponse({ description: 'Package not found' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiBadRequestResponse({
    description: 'Package already cancelled or invalid status transition',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(cancelPackagesSchema))
    body: CancelPackagesSchema
  ) {
    const result = await this.cancelPackageUseCase.execute({
      authorId: currentUser.sub,
      packageId,
      description: body.description,
    });

    if (result.isLeft()) {
      cancelPackageErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        case PackageAlreadyCanceledErrorError:
          throw new BadRequestException(error.message);
        case InvalidatePackageStatusError:
          throw new BadRequestException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }

    cancelPackageSuccessCounter.add(1);
  }
}
