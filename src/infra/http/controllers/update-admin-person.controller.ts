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
import { UpdateAdminPersonUseCase } from '@/domain/delivery/application/use-cases/update-admin-person';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  updateAdminPersonErrorCounter,
  updateAdminPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { AdminPersonPresenter } from '../presenters/admin-person-presenter';

const updateAdminSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
});

type UpdateAdminSchema = z.infer<typeof updateAdminSchema>;

@ApiTags('Admins')
@ApiBearerAuth('JWT-auth')
@Controller('admins')
@Role('Admin')
@UseGuards(RoleGuard)
export class UpdateAdminPersonController {
  constructor(
    private readonly updateAdminPersonUseCase: UpdateAdminPersonUseCase
  ) {}

  @Patch()
  @HttpCode(200)
  @ApiOperation({ summary: 'Update the authenticated admin name and/or email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Admin updated successfully' })
  @ApiBadRequestResponse({ description: 'Admin not found' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Body(new ZodValidationPipe(updateAdminSchema)) body: UpdateAdminSchema
  ) {
    const result = await this.updateAdminPersonUseCase.execute({
      id: currentUser.sub,
      name: body.name,
      email: body.email,
    });

    if (result.isLeft()) {
      updateAdminPersonErrorCounter.add(1);

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

    const { adminPerson } = result.value;

    updateAdminPersonSuccessCounter.add(1);

    return { admin: AdminPersonPresenter.toHttp(adminPerson) };
  }
}
