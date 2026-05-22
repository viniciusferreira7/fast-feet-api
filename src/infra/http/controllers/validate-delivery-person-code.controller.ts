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
import { DeliveryPersonProfileIsDisableError } from '@/domain/delivery/application/use-cases/errors/delivery-person-profile-is-disable-error';
import { ValidDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/validate-delivery-person-code';
import { EmailCodeExpiredError } from '@/domain/delivery/errors/email-code-expired-error';
import { InvalidEmailCodeError } from '@/domain/delivery/errors/invalid-email-code-error';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import { type ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  validateDeliveryPersonCodeErrorCounter,
  validateDeliveryPersonCodeSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const validateDeliveryPersonCodeSchema = z.object({
  email: z.email(),
  code: z.string().min(8),
});

type ValidateDeliveryPersonCodeSchema = z.infer<
  typeof validateDeliveryPersonCodeSchema
>;

@ApiTags('Delivery People')
@Controller('delivery-people/code')
export class ValidateDeliveryPersonCodeController {
  constructor(
    private readonly validDeliveryPersonUseCase: ValidDeliveryPersonUseCase
  ) {}

  @Put()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validate email verification code for a delivery person',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'delivery@example.com',
        },
        code: { type: 'string', minLength: 8, example: 'ABC12345' },
      },
    },
  })
  @ApiOkResponse({ description: 'Code validated successfully' })
  @ApiBadRequestResponse({
    description:
      'Delivery person not found, code expired, invalid code, or profile disabled',
  })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Body(new ZodValidationPipe(validateDeliveryPersonCodeSchema))
    body: ValidateDeliveryPersonCodeSchema
  ) {
    const result = await this.validDeliveryPersonUseCase.execute({
      email: body.email,
      code: body.code,
    });

    if (result.isLeft()) {
      validateDeliveryPersonCodeErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case EmailCodeExpiredError:
          throw new BadRequestException(error.message);
        case InvalidEmailCodeError:
          throw new BadRequestException(error.message);
        case DeliveryPersonProfileIsDisableError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    validateDeliveryPersonCodeSuccessCounter.add(1);
    return { message: 'Code validated successfully' };
  }
}
