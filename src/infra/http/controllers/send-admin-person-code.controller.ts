import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
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
import { TimeToSendNewEmailCodeError } from '@/domain/delivery/application/use-cases/errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { SendAdminPersonCodeUseCase } from '@/domain/delivery/application/use-cases/send-admin-person-code';
import { Public } from '@/infra/auth/decorators/public.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const sendAdminPersonCodeSchema = z.object({
  email: z.email(),
});

type SendAdminPersonCodeSchema = z.infer<typeof sendAdminPersonCodeSchema>;

@ApiTags('Admins')
@Controller('admins/code')
export class SendAdminPersonCodeController {
  constructor(
    private readonly sendAdminPersonCodeUseCase: SendAdminPersonCodeUseCase
  ) {}

  @Post()
  @HttpCode(201)
  @Public()
  @UsePipes(new ZodValidationPipe(sendAdminPersonCodeSchema))
  @ApiOperation({ summary: 'Send email verification code to an admin' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'admin@example.com',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Code sent successfully' })
  @ApiConflictResponse({ description: 'Existing code has not expired yet' })
  @ApiBadRequestResponse({ description: 'Email not found' })
  async handler(@Body() body: SendAdminPersonCodeSchema) {
    const result = await this.sendAdminPersonCodeUseCase.execute({
      email: body.email,
    });

    if (result.isLeft()) {
      const error = result.value;
      switch (error.constructor) {
        case WrongCredentialsError:
          throw new BadRequestException(error.message);
        case TimeToSendNewEmailCodeError:
          throw new ConflictException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }

    return { message: `The code was sent to ${body.email}` };
  }
}
