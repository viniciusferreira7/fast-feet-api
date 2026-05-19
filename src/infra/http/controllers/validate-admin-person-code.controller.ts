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
import { EmailCodeHasNotBeenVerifiedError } from '@/domain/delivery/application/use-cases/errors/email-code-has-not-been-verified-error';
import { ValidateAdminPersonCodeUseCase } from '@/domain/delivery/application/use-cases/validate-admin-person-code';
import { EmailCodeExpiredError } from '@/domain/delivery/errors/email-code-expired-error';
import { InvalidEmailCodeError } from '@/domain/delivery/errors/invalid-email-code-error';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  validateAdminPersonCodeErrorCounter,
  validateAdminPersonCodeSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const validateAdminPersonCodeSchema = z.object({
  email: z.email(),
  code: z.string().min(8),
});

type ValidateAdminPersonCodeSchema = z.infer<
  typeof validateAdminPersonCodeSchema
>;

@ApiTags('Admins')
@Controller('admins/code')
export class ValidateAdminPersonCodeController {
  constructor(
    private readonly validateAdminPersonCodeUseCase: ValidateAdminPersonCodeUseCase
  ) {}

  @Put()
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate email verification code for an admin' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'admin@example.com',
        },
        code: {
          type: 'string',
          minLength: 8,
          example: 'ABC12345',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Code validated successfully' })
  @ApiBadRequestResponse({
    description:
      'Admin not found, code expired, invalid code, or code already verified',
  })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(validateAdminPersonCodeSchema))
    body: ValidateAdminPersonCodeSchema
  ) {
    const result = await this.validateAdminPersonCodeUseCase.execute({
      email: body.email,
      code: body.code,
    });

    if (result.isLeft()) {
      validateAdminPersonCodeErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case EmailCodeExpiredError:
          throw new BadRequestException(error.message);
        case InvalidEmailCodeError:
          throw new BadRequestException(error.message);
        case EmailCodeHasNotBeenVerifiedError:
          throw new BadRequestException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }

    validateAdminPersonCodeSuccessCounter.add(1);
    return { message: 'Code validated successfully' };
  }
}
