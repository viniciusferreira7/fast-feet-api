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
  ApiTags,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { AssignPackageToADeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/assign-package-to-a-delivery-person';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  assignPackageToDeliveryPersonErrorCounter,
  assignPackageToDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const assignPackageToADeliveryPersonSchema = z.object({
  deliveryPersonId: z.uuid(),
  description: z
    .string()
    .nullable()
    .refine((arg) => {
      return !!arg?.trim().length;
    }),
});

type AssignPackageToADeliveryPersonSchema = z.infer<
  typeof assignPackageToADeliveryPersonSchema
>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Controller('packages/:packagesId')
export class AssignPackageToADeliveryPersonController {
  constructor(
    private readonly assignPackageToADeliveryPersonUseCase: AssignPackageToADeliveryPersonUseCase
  ) {}

  @Patch()
  @Role('Admin')
  @HttpCode(200)
  @ApiOperation({ summary: 'Assign a package to a delivery person' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['deliveryPersonId', 'description'],
      properties: {
        deliveryPersonId: {
          type: 'string',
          format: 'uuid',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
        description: {
          type: 'string',
          example: 'Fragile item, handle with care',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Package assigned successfully' })
  @ApiNotFoundResponse({ description: 'Package or delivery person not found' })
  @ApiBadRequestResponse({ description: 'Invalid package status transition' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string,
    @Body(new ZodValidationPipe(assignPackageToADeliveryPersonSchema))
    body: AssignPackageToADeliveryPersonSchema
  ) {
    const result = await this.assignPackageToADeliveryPersonUseCase.execute({
      packageId,
      deliveryPersonId: body.deliveryPersonId,
      description: body.description,
      authorId: currentUser.sub,
    });

    if (result.isLeft()) {
      assignPackageToDeliveryPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case InvalidatePackageStatusError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    assignPackageToDeliveryPersonSuccessCounter.add(1);
    const { package: packageRecord } = result.value;

    return { package: PackagePresenter.toHttp(packageRecord) };
  }
}

//TODO: Create delivery flow and create e2e testes to this controller
