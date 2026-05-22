import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { EmailCodeHasNotBeenVerifiedError } from '@/domain/delivery/application/use-cases/errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { ResetRecipientPersonPassword } from '@/domain/delivery/application/use-cases/reset-recipient-person-password';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  resetRecipientPersonPasswordErrorCounter,
  resetRecipientPersonPasswordSuccessCounter,
} from '@/infra/observability/metrics';
import { passwordSchema } from '@/infra/utils/zod-schemas/password-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const resetPasswordSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  new_password: passwordSchema,
});

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

@ApiTags('Recipients')
@ApiBearerAuth('JWT-auth')
@Controller('recipients/reset-password')
@Role('Recipient')
@UseGuards(RoleGuard)
export class ResetRecipientPersonPasswordController {
  constructor(
    private readonly resetRecipientPersonPassword: ResetRecipientPersonPassword
  ) {}

  @Patch()
  @HttpCode(204)
  @ApiOperation({ summary: 'Reset the password of a recipient' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'new_password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'recipient@example.com',
        },
        password: { type: 'string', example: 'MyS3cur3P@ssw0rd!' },
        new_password: { type: 'string', example: 'N3wS3cur3P@ssw0rd!' },
      },
    },
  })
  @ApiNoContentResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({
    description:
      'Wrong credentials, email not verified, or weak new password',
  })
  @ApiForbiddenResponse({ description: 'Requester is not a recipient' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordSchema
  ) {
    if (currentUser?.type !== 'user' || currentUser.role !== 'recipient') {
      resetRecipientPersonPasswordErrorCounter.add(1);
      throw new ForbiddenException('Only recipients can access this resource.');
    }

    const result = await this.resetRecipientPersonPassword.execute({
      email: body.email,
      password: body.password,
      newPassword: body.new_password,
    });

    if (result.isLeft()) {
      resetRecipientPersonPasswordErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case WrongCredentialsError:
          throw new BadRequestException(error.message);
        case EmailCodeHasNotBeenVerifiedError:
          throw new BadRequestException(error.message);
        case WeakPasswordError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    resetRecipientPersonPasswordSuccessCounter.add(1);
  }
}
