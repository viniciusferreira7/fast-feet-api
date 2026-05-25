import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { RegisterPackageUseCase } from '@/domain/delivery/application/use-cases/register-package';
import { ExternalPostalCodeError } from '@/domain/delivery/errors/external-postal-code-validation-error';
import { InvalidPostalCode } from '@/domain/delivery/errors/invalid-postal-code-error';
import { InvalidatePackageCodeError } from '@/domain/delivery/errors/invalidate-package-code-error';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  registerPackageErrorCounter,
  registerPackageSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const registerPackageSchema = z.object({
  recipientId: z.uuid(),
  name: z.string(),
  recipientAddress: z.string(),
  postalCode: z.string(),
  deliveryPersonId: z.uuid().nullable(),
});

type RegisterPackageSchema = z.infer<typeof registerPackageSchema>;

@ApiTags('Admins')
@ApiBearerAuth('JWT-auth')
@Role('Admin')
@UseGuards(RoleGuard)
@Controller('packages')
export class RegisterPackageController {
  constructor(
    private readonly registerPackageUseCase: RegisterPackageUseCase
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new package (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['recipientId', 'name', 'recipientAddress', 'postalCode'],
      properties: {
        recipientId: {
          type: 'string',
          format: 'uuid',
          example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
        name: {
          type: 'string',
          example: 'Smartphone Samsung Galaxy S24',
        },
        recipientAddress: {
          type: 'string',
          example: 'Av. Paulista, 1000, São Paulo - SP',
        },
        postalCode: {
          type: 'string',
          example: '01310-100',
        },
        deliveryPersonId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Package registered successfully' })
  @ApiBadRequestResponse({
    description:
      'Recipient, delivery person, or admin not found; invalid postal code or package data',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Only admins can register packages' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(registerPackageSchema))
    body: RegisterPackageSchema
  ) {
    const result = await this.registerPackageUseCase.execute({
      recipientId: body.recipientId,
      name: body.name,
      recipientAddress: body.recipientAddress,
      postalCode: body.postalCode,
      deliveryPersonId: body.deliveryPersonId,
      authorId: currentUser.sub,
    });

    if (result.isLeft()) {
      registerPackageErrorCounter.add(1);

      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case InvalidatePackageCodeError:
          throw new BadRequestException(error.message);
        case InvalidatePackageStatusError:
          throw new BadRequestException(error.message);
        case InvalidPostalCode:
          throw new BadRequestException(error.message);
        case ExternalPostalCodeError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    registerPackageSuccessCounter.add(1);

    const { package: packageRecord } = result.value;

    return { package: PackagePresenter.toHttp(packageRecord) };
  }
}
