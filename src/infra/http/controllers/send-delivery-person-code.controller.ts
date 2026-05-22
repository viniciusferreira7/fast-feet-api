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
import { DeliveryPersonProfileIsDisableError } from '@/domain/delivery/application/use-cases/errors/delivery-person-profile-is-disable-error';
import { TimeToSendNewEmailCodeError } from '@/domain/delivery/application/use-cases/errors/time-to-send-new-email-code-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { SendDeliveryPersonCodeUseCase } from '@/domain/delivery/application/use-cases/send-delivery-person-code';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  sendDeliveryPersonCodeErrorCounter,
  sendDeliveryPersonCodeSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const sendDeliveryPersonCodeSchema = z.object({
  email: z.email(),
});

type SendDeliveryPersonCodeSchema = z.infer<
  typeof sendDeliveryPersonCodeSchema
>;

@ApiTags('Delivery People')
@Controller('delivery-people/code')
export class SendDeliveryPersonCodeController {
  constructor(
    private readonly sendDeliveryPersonCodeUseCase: SendDeliveryPersonCodeUseCase
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Send email verification code to a delivery person',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'delivery@example.com',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Code sent successfully' })
  @ApiConflictResponse({ description: 'Existing code has not expired yet' })
  @ApiBadRequestResponse({ description: 'Email not found or profile disabled' })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(sendDeliveryPersonCodeSchema))
    body: SendDeliveryPersonCodeSchema
  ) {
    const result = await this.sendDeliveryPersonCodeUseCase.execute({
      email: body.email,
    });

    if (result.isLeft()) {
      sendDeliveryPersonCodeErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case WrongCredentialsError:
          throw new BadRequestException(error.message);
        case TimeToSendNewEmailCodeError:
          throw new ConflictException(error.message);
        case DeliveryPersonProfileIsDisableError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    sendDeliveryPersonCodeSuccessCounter.add(1);
    return { message: `The code was sent to ${body.email}` };
  }
}
