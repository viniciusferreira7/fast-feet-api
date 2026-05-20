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
import { ResetAdminPersonPasswordUseCase } from '@/domain/delivery/application/use-cases/reset-admin-person-password';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  resetAdminPersonPasswordErrorCounter,
  resetAdminPersonPasswordSuccessCounter,
} from '@/infra/observability/metrics';
import { passwordSchema } from '@/infra/utils/zod-schemas/password-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const resetPasswordSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  newPassword: passwordSchema,
});

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

@ApiTags('Admins')
@ApiBearerAuth('JWT-auth')
@Controller('admins/reset-password')
@Role('Admin')
@UseGuards(RoleGuard)
export class ResetAdminPersonPasswordController {
  constructor(
    private readonly resetAdminPersonPasswordUseCase: ResetAdminPersonPasswordUseCase
  ) {}

  @Patch()
  @HttpCode(204)
  @ApiOperation({ summary: 'Reset the password of an admin' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'newPassword'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'admin@example.com',
        },
        password: {
          type: 'string',
          example: 'MyS3cur3P@ssw0rd!',
        },
        newPassword: {
          type: 'string',
          example: 'N3wS3cur3P@ssw0rd!',
        },
      },
    },
  })
  @ApiNoContentResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({
    description: 'Wrong credentials, email not verified, or weak new password',
  })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordSchema
  ) {
    if (currentUser?.type !== 'user') {
      resetAdminPersonPasswordErrorCounter.add(1);
      throw new ForbiddenException('Only users can access this resource.');
    }

    if (currentUser.role !== 'admin') {
      resetAdminPersonPasswordErrorCounter.add(1);
      throw new ForbiddenException(
        'You do not have administrator permissions.'
      );
    }

    const result = await this.resetAdminPersonPasswordUseCase.execute({
      email: body.email,
      password: body.password,
      newPassword: body.newPassword,
    });

    if (result.isLeft()) {
      resetAdminPersonPasswordErrorCounter.add(1);
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

    resetAdminPersonPasswordSuccessCounter.add(1);
  }
}
