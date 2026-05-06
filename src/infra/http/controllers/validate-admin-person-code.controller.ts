import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Put,
  UsePipes,
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
import { Public } from '@/infra/auth/decorators/public.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

//TODO: After complete this controller, start creation of e2e for admin,
// create helpers for e2e to not repeat same code blocks,
// like create, send code, validate code, and authenticate
// to use on another e2e tests, but create full flow on this tests said before

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
  @Public()
  @UsePipes(new ZodValidationPipe(validateAdminPersonCodeSchema))
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
  async handler(@Body() body: ValidateAdminPersonCodeSchema) {
    const result = await this.validateAdminPersonCodeUseCase.execute({
      email: body.email,
      code: body.code,
    });

    if (result.isLeft()) {
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

    return { message: 'Code validated successfully' };
  }
}
