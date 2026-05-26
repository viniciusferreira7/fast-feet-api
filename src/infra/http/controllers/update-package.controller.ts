import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
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
import { UpdatePackage } from '@/domain/delivery/application/use-cases/update-package';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  updatePackageErrorCounter,
  updatePackageSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const updatePackageSchema = z.object({
  name: z.string().min(1).max(255),
  recipientAddress: z.string().min(1).max(500),
  description: z.string().min(1).max(500).optional(),
});

type UpdatePackageSchema = z.infer<typeof updatePackageSchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Admin')
@Controller('packages/:packageId')
export class UpdatePackageController {
  constructor(private readonly updatePackageUseCase: UpdatePackage) {}

  @Put()
  @HttpCode(200)
  @ApiOperation({ summary: 'Update package details (admin only)' })
  @ApiParam({ name: 'packageId', description: 'Package ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'recipientAddress'],
      properties: {
        name: { type: 'string', maxLength: 255 },
        recipientAddress: { type: 'string', maxLength: 500 },
        description: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiOkResponse({ description: 'Package updated successfully' })
  @ApiNotFoundResponse({ description: 'Package not found' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(updatePackageSchema))
    body: UpdatePackageSchema
  ) {
    const result = await this.updatePackageUseCase.execute({
      authorId: currentUser.sub,
      packageId,
      name: body.name,
      recipientAddress: body.recipientAddress,
      description: body.description,
    });

    if (result.isLeft()) {
      updatePackageErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        default:
          throw new NotFoundException(error.message);
      }
    }

    updatePackageSuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
