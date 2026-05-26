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
import { PackageAlreadyAssignedError } from '@/domain/delivery/application/use-cases/errors/package-already-assined-erro';
import { PackageNotAssignedToDeliveryPersonError } from '@/domain/delivery/application/use-cases/errors/package-not-assigned-to-delivery-person-error';
import { PickUpPackageUseCase } from '@/domain/delivery/application/use-cases/picked-up-package';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  pickedUpPackageErrorCounter,
  pickedUpPackageSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const pickUpPackageSchema = z.object({
  description: z.string().min(1).max(500).optional(),
});

type PickUpPackageSchema = z.infer<typeof pickUpPackageSchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Delivery')
@Controller('packages/:packageId/pick-up')
export class PickedUpPackageController {
  constructor(private readonly pickUpPackageUseCase: PickUpPackageUseCase) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Mark a package as picked up (delivery person only)',
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
  @ApiNoContentResponse({ description: 'Package marked as picked up' })
  @ApiNotFoundResponse({ description: 'Package not found' })
  @ApiForbiddenResponse({
    description: 'Not a delivery person or package assigned to another',
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(pickUpPackageSchema))
    body: PickUpPackageSchema
  ) {
    const result = await this.pickUpPackageUseCase.execute({
      packageId,
      deliveryPersonId: currentUser.sub,
      description: body.description,
    });

    if (result.isLeft()) {
      pickedUpPackageErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case PackageAlreadyAssignedError:
          throw new ForbiddenException(error.message);
        case PackageNotAssignedToDeliveryPersonError:
          throw new BadRequestException(error.message);
        case InvalidatePackageStatusError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    pickedUpPackageSuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
