import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotAcceptableException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotAcceptableResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { OnlyAdminCanPerformThisActionError } from '@/domain/delivery/application/use-cases/errors/only-admin-can-perform-this-action-error';
import { GetByIdAdminPersonUseCase } from '@/domain/delivery/application/use-cases/get-by-id-admin-person';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  getByIdAdminPersonErrorCounter,
  getByIdAdminPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { AdminPersonPresenter } from '../presenters/admin-person-presenter';

@ApiTags('Admins')
@ApiBearerAuth('JWT-auth')
@Controller('admins/:id')
@Role('Admin')
@UseGuards(RoleGuard)
export class GetByIdAdminPersonController {
  constructor(private readonly getByIdAdminPerson: GetByIdAdminPersonUseCase) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get an admin person by ID' })
  @ApiParam({ name: 'id', description: 'Admin person ID', type: 'string' })
  @ApiOkResponse({
    description: 'Admin found',
    schema: {
      type: 'object',
      properties: {
        admin: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            cpf: { type: 'string' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
      },
    },
  })
  @ApiNotAcceptableResponse({ description: 'Admin not found' })
  @ApiForbiddenResponse({
    description:
      'Requester is not an admin or does not have permission to view this profile',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('id') adminId: string
  ) {
    const result = await this.getByIdAdminPerson.execute({
      adminPersonId: adminId,
      authorId: currentUser.sub,
    });

    if (result.isLeft()) {
      getByIdAdminPersonErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotAcceptableException(error.message);
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }

    getByIdAdminPersonSuccessCounter.add(1);

    const { adminPerson } = result.value;

    return { admin: AdminPersonPresenter.toHttp(adminPerson) };
  }
}
