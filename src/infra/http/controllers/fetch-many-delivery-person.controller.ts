import {
  BadRequestException,
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
import { FetchManyDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/fetch-many-delivery-person';
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import type { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  fetchManyDeliveryPersonErrorCounter,
  fetchManyDeliveryPersonSuccessCounter,
} from '@/infra/observability/metrics';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';
import { DeliveryPersonPresenter } from '../presenters/delivery-person-presenter';

const fetchManyDeliveryPersonSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  cpf: z.string().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  order: z.string().optional(),
});

type FetchManyDeliveryPersonSchema = z.infer<
  typeof fetchManyDeliveryPersonSchema
>;

@ApiTags('Delivery People')
@ApiBearerAuth('JWT-auth')
@Controller('delivery-people')
@Role('Admin')
@UseGuards(RoleGuard)
export class FetchManyDeliveryPersonController {
  constructor(
    private readonly fetchManyDeliveryPersonUseCase: FetchManyDeliveryPersonUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Fetch many delivery people (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'cpf', required: false, type: String })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'order', required: false, type: String })
  @ApiOkResponse({ description: 'List of delivery people' })
  @ApiForbiddenResponse({ description: 'Requester is not an admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(
    @CurrentUser() currentUser: UserPayload,
    @Query(new ZodValidationPipe(fetchManyDeliveryPersonSchema))
    query: FetchManyDeliveryPersonSchema
  ) {
    const result = await this.fetchManyDeliveryPersonUseCase.execute({
      authorId: currentUser.sub,
      page: query.page,
      perPage: query.per_page,
      search: query.search,
      name: query.name,
      email: query.email,
      cpf: query.cpf,
      isActive: query.is_active,
      order: query.order as Parameters<
        typeof this.fetchManyDeliveryPersonUseCase.execute
      >[0]['order'],
    });

    if (result.isLeft()) {
      fetchManyDeliveryPersonErrorCounter.add(1);
      const error = result.value;
      switch (error.constructor) {
        case OnlyAdminCanPerformThisActionError:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    fetchManyDeliveryPersonSuccessCounter.add(1);
    const { deliveryPeople } = result.value;
    return {
      page: deliveryPeople.page,
      total_pages: deliveryPeople.totalPages,
      per_page: deliveryPeople.perPage,
      delivery_people: deliveryPeople.result.map(DeliveryPersonPresenter.toHttp),
    };
  }
}
