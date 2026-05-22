import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { PersonAlreadyExistsError } from '@/domain/delivery/application/use-cases/errors/person-already-exists-error';
import { RegisterDeliveryPerson } from '@/domain/delivery/application/use-cases/register-delivery-person';
import { InvalidateCpfError } from '@/domain/delivery/errors/invalidate-cpf-error';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  registerDeliveryPersonErrorCounter,
  registerDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { cpfSchema } from '@/infra/utils/zod-schemas/cpf-schema';
import { passwordSchema } from '@/infra/utils/zod-schemas/password-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { DeliveryPersonPresenter } from '../presenters/delivery-person-presenter';

const registerDeliveryPersonSchema = z.object({
  name: z.string(),
  cpf: cpfSchema,
  email: z.email(),
  password: passwordSchema,
});

type RegisterDeliveryPersonSchema = z.infer<typeof registerDeliveryPersonSchema>;

@ApiTags('Delivery People')
@ApiBearerAuth('JWT-auth')
@Role('Admin')
@UseGuards(RoleGuard)
@Controller('/delivery-people')
export class RegisterDeliveryPersonController {
  constructor(private readonly registerDeliveryPerson: RegisterDeliveryPerson) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new delivery person (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'cpf', 'email', 'password'],
      properties: {
        name: { type: 'string', example: 'John Doe' },
        cpf: { type: 'string', example: '123.456.789-09' },
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        password: {
          type: 'string',
          format: 'password',
          description:
            'Min 8 chars, must include uppercase, lowercase, number, and special character',
          example: 'Str0ng!Pass',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Delivery person registered successfully' })
  @ApiConflictResponse({ description: 'CPF or email already in use' })
  @ApiBadRequestResponse({
    description: 'Invalid CPF, weak password, or author not found',
  })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(registerDeliveryPersonSchema))
    body: RegisterDeliveryPersonSchema
  ) {
    const result = await this.registerDeliveryPerson.execute({
      name: body.name,
      cpf: body.cpf,
      email: body.email,
      password: body.password,
      authorId: currentUser.sub,
    });

    if (result.isLeft()) {
      registerDeliveryPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case InvalidateCpfError:
          throw new BadRequestException(error.message);
        case PersonAlreadyExistsError:
          throw new ConflictException(error.message);
        case WeakPasswordError:
          throw new BadRequestException(error.message);
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const { deliveryPerson } = result.value;
    registerDeliveryPersonSuccessCounter.add(1);
    return { delivery_person: DeliveryPersonPresenter.toHttp(deliveryPerson) };
  }
}
