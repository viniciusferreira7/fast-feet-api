import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { ValidateRecipientPersonCodeUseCase } from '@/domain/delivery/application/use-cases/validate-recipient-person-code';
import { EmailCodeExpiredError } from '@/domain/delivery/errors/email-code-expired-error';
import { InvalidEmailCodeError } from '@/domain/delivery/errors/invalid-email-code-error';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  validateRecipientPersonCodeErrorCounter,
  validateRecipientPersonCodeSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const validateRecipientPersonCodeSchema = z.object({
  email: z.email(),
  code: z.string().min(8),
});

type ValidateRecipientPersonCodeSchema = z.infer<
  typeof validateRecipientPersonCodeSchema
>;

@ApiTags('Recipients')
@Controller('recipients/code')
export class ValidateRecipientPersonCodeController {
  constructor(
    private readonly validateRecipientPersonCodeUseCase: ValidateRecipientPersonCodeUseCase
  ) {}

  @Put()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validate email verification code for a recipient',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'recipient@example.com',
        },
        code: { type: 'string', minLength: 8, example: 'ABC12345' },
      },
    },
  })
  @ApiOkResponse({ description: 'Code validated successfully' })
  @ApiBadRequestResponse({
    description: 'Recipient not found, code expired, or invalid code',
  })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(validateRecipientPersonCodeSchema))
    body: ValidateRecipientPersonCodeSchema
  ) {
    const result = await this.validateRecipientPersonCodeUseCase.execute({
      email: body.email,
      code: body.code,
    });

    if (result.isLeft()) {
      validateRecipientPersonCodeErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case EmailCodeExpiredError:
          throw new BadRequestException(error.message);
        case InvalidEmailCodeError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    validateRecipientPersonCodeSuccessCounter.add(1);
    return { message: 'Code validated successfully' };
  }
}
