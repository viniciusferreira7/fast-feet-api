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
import { TimeToSendNewEmailCodeError } from '@/domain/delivery/application/use-cases/errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { SendRecipientPersonCodeUseCase } from '@/domain/delivery/application/use-cases/send-recipient-person-code';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  sendRecipientPersonCodeErrorCounter,
  sendRecipientPersonCodeSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const sendRecipientPersonCodeSchema = z.object({
  email: z.email(),
});

type SendRecipientPersonCodeSchema = z.infer<
  typeof sendRecipientPersonCodeSchema
>;

@ApiTags('Recipients')
@Controller('recipients/code')
export class SendRecipientPersonCodeController {
  constructor(
    private readonly sendRecipientPersonCodeUseCase: SendRecipientPersonCodeUseCase
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Send email verification code to a recipient' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'recipient@example.com',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Code sent successfully' })
  @ApiConflictResponse({ description: 'Existing code has not expired yet' })
  @ApiBadRequestResponse({ description: 'Email not found' })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(sendRecipientPersonCodeSchema))
    body: SendRecipientPersonCodeSchema
  ) {
    const result = await this.sendRecipientPersonCodeUseCase.execute({
      email: body.email,
    });

    if (result.isLeft()) {
      sendRecipientPersonCodeErrorCounter.add(1);
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

    sendRecipientPersonCodeSuccessCounter.add(1);
    return { message: `The code was sent to ${body.email}` };
  }
}
