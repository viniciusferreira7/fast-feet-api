import {
  BadRequestException,
  Body,
  Controller,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DeliveryWithoutRequiredPhoto } from '@/domain/delivery/application/use-cases/errors/delivery-without-required-photo';
import { PackageWasDeliveredUseCase } from '@/domain/delivery/application/use-cases/package-was-delivered';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  packageWasDeliveredErrorCounter,
  packageWasDeliveredSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const packageWasDeliveredSchema = z.object({
  attachmentId: z.uuid(),
  description: z.string().min(1).max(500).optional(),
});

type PackageWasDeliveredSchema = z.infer<typeof packageWasDeliveredSchema>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Delivery')
@Controller('packages/:packageId/deliver')
export class PackageWasDeliveredController {
  constructor(
    private readonly packageWasDeliveredUseCase: PackageWasDeliveredUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Mark a package as delivered (delivery person only)',
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
  @ApiOkResponse({ description: 'Package marked as delivered' })
  @ApiNotFoundResponse({
    description: 'Package, attachment, or delivery person not found',
  })
  @ApiBadRequestResponse({
    description: 'Missing proof photo or invalid status transition',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(packageWasDeliveredSchema))
    body: PackageWasDeliveredSchema
  ) {
    const result = await this.packageWasDeliveredUseCase.execute({
      packageId,
      deliveryPersonId: currentUser.sub,
      attachmentId: body.attachmentId,
      description: body.description,
    });

    if (result.isLeft()) {
      packageWasDeliveredErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case DeliveryWithoutRequiredPhoto:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    packageWasDeliveredSuccessCounter.add(1);
    return { package: PackagePresenter.toHttp(result.value.package) };
  }
}
