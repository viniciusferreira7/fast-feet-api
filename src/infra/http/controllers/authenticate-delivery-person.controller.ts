import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import z from 'zod';
import { AuthenticateDeliveryPerson } from '@/domain/delivery/application/use-cases/authenticate-delivery-person';
import { DeliveryPersonProfileIsDisableError } from '@/domain/delivery/application/use-cases/errors/delivery-person-profile-is-disable-error';
import { EmailCodeHasNotBeenVerifiedError } from '@/domain/delivery/application/use-cases/errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  authenticateDeliveryPersonErrorCounter,
  authenticateDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { cpfSchema } from '@/infra/utils/zod-schemas/cpf-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const authenticateDeliveryPersonSchema = z.object({
  cpf: cpfSchema,
  password: z.string().min(1),
});

type AuthenticateDeliveryPersonSchema = z.infer<
  typeof authenticateDeliveryPersonSchema
>;

@ApiTags('Delivery People')
@Controller('delivery-people/login')
export class AuthenticateDeliveryPersonController {
  constructor(
    private readonly authenticateDeliveryPerson: AuthenticateDeliveryPerson
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate a delivery person' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cpf', 'password'],
      properties: {
        cpf: { type: 'string', example: '123.456.789-09' },
        password: { type: 'string', format: 'password', example: 'Str0ng!Pass' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Delivery person authenticated successfully',
    schema: {
      type: 'object',
      properties: { access_token: { type: 'string' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Wrong credentials, email not verified, or profile disabled',
  })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(authenticateDeliveryPersonSchema))
    body: AuthenticateDeliveryPersonSchema
  ) {
    const result = await this.authenticateDeliveryPerson.execute({
      cpf: body.cpf,
      password: body.password,
    });

    if (result.isLeft()) {
      authenticateDeliveryPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case WrongCredentialsError:
          throw new BadRequestException(error.message);
        case EmailCodeHasNotBeenVerifiedError:
          throw new BadRequestException(error.message);
        case DeliveryPersonProfileIsDisableError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    authenticateDeliveryPersonSuccessCounter.add(1);
    return { access_token: result.value.accessToken };
  }
}
