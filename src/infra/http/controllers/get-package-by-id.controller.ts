import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { OnlyAdminCanPerformThisActionError } from '@/domain/delivery/application/use-cases/errors/only-admin-can-perform-this-action-error';
import { GetByPackageByIdUseCase } from '@/domain/delivery/application/use-cases/get-package-by-id';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  getPackageByIdErrorCounter,
  getPackageByIdSuccessCounter,
} from '@/infra/observability/metrics';
import { PackageDetailsPresenter } from '../presenters/package-details-presenter';

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@Controller('packages/:packageId')
@Role('Admin')
@UseGuards(RoleGuard)
export class GetPackageByIdController {
  constructor(
    private readonly getByPackageByIdUseCase: GetByPackageByIdUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a package by ID (admin only)' })
  @ApiParam({ name: 'packageId', description: 'Package ID', type: 'string' })
  @ApiOkResponse({ description: 'Package found' })
  @ApiNotFoundResponse({ description: 'Package not found' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('packageId') packageId: string
  ) {
    const result = await this.getByPackageByIdUseCase.execute({
      authorId: currentUser.sub,
      packageId,
    });

    if (result.isLeft()) {
      getPackageByIdErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        default:
          throw new NotFoundException(error.message);
      }
    }

    getPackageByIdSuccessCounter.add(1);
    return { package: PackageDetailsPresenter.toHttp(result.value.package) };
  }
}
