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
import { DeliveryPersonProfileIsDisableError } from '@/domain/delivery/application/use-cases/errors/delivery-person-profile-is-disable-error';
import { EmailCodeHasNotBeenVerifiedError } from '@/domain/delivery/application/use-cases/errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { ResetDeliveryPersonPassword } from '@/domain/delivery/application/use-cases/reset-delivery-person-password';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  resetDeliveryPersonPasswordErrorCounter,
  resetDeliveryPersonPasswordSuccessCounter,
} from '@/infra/observability/metrics';
import { passwordSchema } from '@/infra/utils/zod-schemas/password-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const resetPasswordSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  new_password: passwordSchema,
});

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

@ApiTags('Delivery People')
@ApiBearerAuth('JWT-auth')
@Controller('delivery-people/reset-password')
@Role('Delivery')
@UseGuards(RoleGuard)
export class ResetDeliveryPersonPasswordController {
  constructor(
    private readonly resetDeliveryPersonPassword: ResetDeliveryPersonPassword
  ) {}

  @Patch()
  @HttpCode(204)
  @ApiOperation({ summary: 'Reset the password of a delivery person' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'new_password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'delivery@example.com',
        },
        password: { type: 'string', example: 'MyS3cur3P@ssw0rd!' },
        new_password: { type: 'string', example: 'N3wS3cur3P@ssw0rd!' },
      },
    },
  })
  @ApiNoContentResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({
    description:
      'Wrong credentials, email not verified, weak new password, or profile disabled',
  })
  @ApiForbiddenResponse({ description: 'Requester is not a delivery person' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordSchema
  ) {
    if (currentUser?.type !== 'user' || currentUser.role !== 'delivery') {
      resetDeliveryPersonPasswordErrorCounter.add(1);
      throw new ForbiddenException(
        'Only delivery people can access this resource.'
      );
    }

    const result = await this.resetDeliveryPersonPassword.execute({
      email: body.email,
      password: body.password,
      newPassword: body.new_password,
    });

    if (result.isLeft()) {
      resetDeliveryPersonPasswordErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case WrongCredentialsError:
          throw new BadRequestException(error.message);
        case EmailCodeHasNotBeenVerifiedError:
          throw new BadRequestException(error.message);
        case WeakPasswordError:
          throw new BadRequestException(error.message);
        case DeliveryPersonProfileIsDisableError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    resetDeliveryPersonPasswordSuccessCounter.add(1);
  }
}
