import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import z from 'zod';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { FetchPackagesNearByDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/fetch-packages-near-by-delivery-person';
import { ExternalPostalCodeError } from '@/domain/delivery/errors/external-postal-code-validation-error';
import { InvalidPostalCode } from '@/domain/delivery/errors/invalid-postal-code-error';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  fetchPackagesNearByDeliveryPersonErrorCounter,
  fetchPackagesNearByDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { PackagePresenter } from '../presenters/package-presenter';

const fetchPackagesNearBySchema = z.object({
  postal_code: z.string().min(1),
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().optional(),
});

type FetchPackagesNearBySchema = z.infer<typeof fetchPackagesNearBySchema>;

@ApiTags('Delivery People')
@ApiBearerAuth('JWT-auth')
@Controller('delivery-people/:id/packages')
@Role('Admin', 'Delivery')
@UseGuards(RoleGuard)
export class FetchPackagesNearByDeliveryPersonController {
  constructor(
    private readonly fetchPackagesNearByDeliveryPersonUseCase: FetchPackagesNearByDeliveryPersonUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Fetch packages near by a delivery person postal code',
  })
  @ApiParam({ name: 'id', description: 'Delivery person ID', type: 'string' })
  @ApiQuery({ name: 'postal_code', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiOkResponse({ description: 'List of nearby packages' })
  @ApiBadRequestResponse({
    description:
      'Delivery person or admin not found, invalid or unresolvable postal code',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Param('id') deliveryPersonId: string,
    @Query(new ZodValidationPipe(fetchPackagesNearBySchema))
    query: FetchPackagesNearBySchema
  ) {
    const result = await this.fetchPackagesNearByDeliveryPersonUseCase.execute({
      authorId: currentUser.sub,
      deliveryPersonId,
      deliveryPersonPostalCodeLocation: query.postal_code,
      page: query.page,
      perPage: query.per_page,
    });

    if (result.isLeft()) {
      fetchPackagesNearByDeliveryPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new BadRequestException(error.message);
        case InvalidPostalCode:
          throw new BadRequestException(error.message);
        case ExternalPostalCodeError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    fetchPackagesNearByDeliveryPersonSuccessCounter.add(1);
    const { packages } = result.value;
    return {
      page: packages.page,
      total_pages: packages.totalPages,
      per_page: packages.perPage,
      packages: packages.result.map(PackagePresenter.toHttp),
    };
  }
}
