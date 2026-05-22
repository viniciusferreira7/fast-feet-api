import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { EmailAlreadyInUseError } from '@/domain/delivery/application/use-cases/errors/email-already-in-use-error';
import { UpdateRecipientPersonUseCase } from '@/domain/delivery/application/use-cases/update-recipient-person';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  updateRecipientPersonErrorCounter,
  updateRecipientPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { RecipientPersonPresenter } from '../presenters/recipient-person-presenter';

const updateRecipientPersonSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
});

type UpdateRecipientPersonSchema = z.infer<typeof updateRecipientPersonSchema>;

@ApiTags('Recipients')
@ApiBearerAuth('JWT-auth')
@Controller('recipients')
@Role('Recipient')
@UseGuards(RoleGuard)
export class UpdateRecipientPersonController {
  constructor(
    private readonly updateRecipientPersonUseCase: UpdateRecipientPersonUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Update the authenticated recipient name and/or email',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Recipient updated successfully' })
  @ApiBadRequestResponse({ description: 'Recipient not found' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiForbiddenResponse({ description: 'Requester is not a recipient' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(updateRecipientPersonSchema))
    body: UpdateRecipientPersonSchema
  ) {
    const result = await this.updateRecipientPersonUseCase.execute({
      id: currentUser.sub,
      name: body.name,
      email: body.email,
    });

    if (result.isLeft()) {
      updateRecipientPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case EmailAlreadyInUseError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const { recipientPerson } = result.value;
    updateRecipientPersonSuccessCounter.add(1);
    return { recipient: RecipientPersonPresenter.toHttp(recipientPerson) };
  }
}
