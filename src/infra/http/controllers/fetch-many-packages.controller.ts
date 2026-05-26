import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { OnlyAdminCanPerformThisActionError } from '@/domain/delivery/application/use-cases/errors/only-admin-can-perform-this-action-error';
import { FetchManyPackagesUseCase } from '@/domain/delivery/application/use-cases/fetch-many-packages';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  fetchManyPackagesErrorCounter,
  fetchManyPackagesSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const fetchManyPackagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  code: z.string().optional(),
  status: z.string().optional(),
  postal_code: z.string().optional(),
  order: z
    .enum([
      'created_at',
      'updated_at',
      'name',
      'code',
      'recipient_address',
      'status',
      'postal_code',
      '-created_at',
      '-updated_at',
      '-name',
      '-code',
      '-recipient_address',
      '-status',
      '-postal_code',
    ])
    .optional(),
  delivered_at_gte: z.string().datetime({ offset: true }).optional(),
  created_at_gte: z.string().datetime({ offset: true }).optional(),
  updated_at_gte: z.string().datetime({ offset: true }).optional(),
});

type FetchManyPackagesQuerySchema = z.infer<
  typeof fetchManyPackagesQuerySchema
>;

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Role('Admin')
@Controller('packages')
export class FetchManyPackagesController {
  constructor(
    private readonly fetchManyPackagesUseCase: FetchManyPackagesUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'List packages with filters and pagination (admin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'postal_code', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  @ApiQuery({ name: 'delivered_at_gte', required: false, type: String })
  @ApiQuery({ name: 'created_at_gte', required: false, type: String })
  @ApiQuery({ name: 'updated_at_gte', required: false, type: String })
  @ApiOkResponse({ description: 'Paginated list of packages' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Query(new ZodValidationPipe(fetchManyPackagesQuerySchema))
    query: FetchManyPackagesQuerySchema
  ) {
    const result = await this.fetchManyPackagesUseCase.execute({
      authorId: currentUser.sub,
      page: query.page,
      perPage: query.per_page,
      search: query.search,
      code: query.code,
      status: query.status,
      postalCode: query.postal_code,
      order: query.order,
      deliveredAtGte: query.delivered_at_gte
        ? new Date(query.delivered_at_gte)
        : undefined,
      createdAtGte: query.created_at_gte
        ? new Date(query.created_at_gte)
        : undefined,
      updatedAtGte: query.updated_at_gte
        ? new Date(query.updated_at_gte)
        : undefined,
    });

    if (result.isLeft()) {
      fetchManyPackagesErrorCounter.add(1);
      const error = result.value;

      switch (error.constructor) {
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        default:
          throw new ForbiddenException(error.message);
      }
    }

    fetchManyPackagesSuccessCounter.add(1);
    const { packages } = result.value;

    return {
      packages: packages.result.map(PackagePresenter.toHttp),
      page: packages.page,
      per_page: packages.perPage,
      total_pages: packages.totalPages,
    };
  }
}
