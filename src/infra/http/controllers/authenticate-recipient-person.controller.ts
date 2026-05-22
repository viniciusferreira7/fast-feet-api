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
import { AuthenticateRecipientPerson } from '@/domain/delivery/application/use-cases/authenticate-recipient-person';
import { EmailCodeHasNotBeenVerifiedError } from '@/domain/delivery/application/use-cases/errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  authenticateRecipientPersonErrorCounter,
  authenticateRecipientPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { cpfSchema } from '@/infra/utils/zod-schemas/cpf-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const authenticateRecipientPersonSchema = z.object({
  cpf: cpfSchema,
  password: z.string().min(1),
});

type AuthenticateRecipientPersonSchema = z.infer<
  typeof authenticateRecipientPersonSchema
>;

@ApiTags('Recipients')
@Controller('recipients/login')
export class AuthenticateRecipientPersonController {
  constructor(
    private readonly authenticateRecipientPerson: AuthenticateRecipientPerson
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate a recipient' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cpf', 'password'],
      properties: {
        cpf: { type: 'string', example: '123.456.789-09' },
        password: {
          type: 'string',
          format: 'password',
          example: 'Str0ng!Pass',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Recipient authenticated successfully',
    schema: {
      type: 'object',
      properties: { access_token: { type: 'string' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Wrong credentials or email not verified',
  })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(authenticateRecipientPersonSchema))
    body: AuthenticateRecipientPersonSchema
  ) {
    const result = await this.authenticateRecipientPerson.execute({
      cpf: body.cpf,
      password: body.password,
    });

    if (result.isLeft()) {
      authenticateRecipientPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case WrongCredentialsError:
          throw new BadRequestException(error.message);
        case EmailCodeHasNotBeenVerifiedError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    authenticateRecipientPersonSuccessCounter.add(1);
    return { access_token: result.value.accessToken };
  }
}
