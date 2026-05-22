import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import z from 'zod';
import { PersonAlreadyExistsError } from '@/domain/delivery/application/use-cases/errors/person-already-exists-error';
import { RegisterRecipientPerson } from '@/domain/delivery/application/use-cases/register-recipient-person';
import { InvalidateCpfError } from '@/domain/delivery/errors/invalidate-cpf-error';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  registerRecipientPersonErrorCounter,
  registerRecipientPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { cpfSchema } from '@/infra/utils/zod-schemas/cpf-schema';
import { passwordSchema } from '@/infra/utils/zod-schemas/password-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { RecipientPersonPresenter } from '../presenters/recipient-person-presenter';

const registerRecipientPersonSchema = z.object({
  name: z.string(),
  cpf: cpfSchema,
  email: z.email(),
  password: passwordSchema,
});

type RegisterRecipientPersonSchema = z.infer<
  typeof registerRecipientPersonSchema
>;

@ApiTags('Recipients')
@Controller('/recipients')
export class RegisterRecipientPersonController {
  constructor(
    private readonly registerRecipientPerson: RegisterRecipientPerson
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new recipient (self-registration)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'cpf', 'email', 'password'],
      properties: {
        name: { type: 'string', example: 'Jane Doe' },
        cpf: { type: 'string', example: '123.456.789-09' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
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
  @ApiCreatedResponse({ description: 'Recipient registered successfully' })
  @ApiConflictResponse({ description: 'CPF or email already in use' })
  @ApiBadRequestResponse({ description: 'Invalid CPF or weak password' })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(registerRecipientPersonSchema))
    body: RegisterRecipientPersonSchema
  ) {
    const result = await this.registerRecipientPerson.execute({
      name: body.name,
      cpf: body.cpf,
      email: body.email,
      password: body.password,
    });

    if (result.isLeft()) {
      registerRecipientPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case InvalidateCpfError:
          throw new BadRequestException(error.message);
        case PersonAlreadyExistsError:
          throw new ConflictException(error.message);
        case WeakPasswordError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const { recipientPerson } = result.value;
    registerRecipientPersonSuccessCounter.add(1);
    return { recipient: RecipientPersonPresenter.toHttp(recipientPerson) };
  }
}
