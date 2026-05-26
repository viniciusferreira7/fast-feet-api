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
import { PackageIsInTransitUsaCase } from '@/domain/delivery/application/use-cases/package-is-in-transit';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  packageIsInTransitErrorCounter,
  packageIsInTransitSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const packageIsInTransitSchema = z.object({
  deliveryPersonId: z.uuid(),
  description: z.string().min(1).max(500).optional(),
});

type PackageIsInTransitSchema = z.infer<typeof packageIsInTransitSchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Admin')
@Controller('packages/:packageId/in-transit')
export class PackageIsInTransitController {
  constructor(
    private readonly packageIsInTransitUseCase: PackageIsInTransitUsaCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a package as in transit (admin only)' })
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
  @ApiOkResponse({ description: 'Package marked as in transit' })
  @ApiNotFoundResponse({ description: 'Package or delivery person not found' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiBadRequestResponse({
    description: 'Invalid status transition or delivery person not assigned',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(packageIsInTransitSchema))
    body: PackageIsInTransitSchema
  ) {
    const result = await this.packageIsInTransitUseCase.execute({
      authorId: currentUser.sub,
      deliveryPersonId: body.deliveryPersonId,
      packageId,
      description: body.description,
    });

    if (result.isLeft()) {
      packageIsInTransitErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    packageIsInTransitSuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
