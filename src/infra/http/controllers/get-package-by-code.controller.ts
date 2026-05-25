import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { GetByPackageByCodeUseCase } from '@/domain/delivery/application/use-cases/get-package-by-code';
import { CurrentAPiKey } from '@/infra/auth/decorators/current-api-key.decorator';
import type { ApiPayload } from '@/infra/auth/jwt.strategy';
import {
  getPackageByCodeErrorCounter,
  getPackageByCodeSuccessCounter,
} from '@/infra/observability/metrics';
import { PackageDetailsPresenter } from '../presenters/package-details-presenter';

@ApiTags('Packages')
@ApiBearerAuth('API-Key')
@Controller('packages/track/:code')
export class GetPackageByCodeController {
  constructor(
    private readonly getByPackageByCodeUseCase: GetByPackageByCodeUseCase
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Track a package by its code' })
  @ApiParam({
    name: 'code',
    description: 'Package tracking code',
    example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  })
  @ApiOkResponse({ description: 'Package tracking information' })
  @ApiNotFoundResponse({ description: 'Package not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid API key' })
  async handler(
    @CurrentAPiKey() _apiKey: ApiPayload,
    @Param('code') code: string
  ) {
    const result = await this.getByPackageByCodeUseCase.execute({
      packageCode: code,
    });

    if (result.isLeft()) {
      getPackageByCodeErrorCounter.add(1);

      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new NotFoundException(error.message);
      }
    }

    getPackageByCodeSuccessCounter.add(1);

    return {
      package: PackageDetailsPresenter.toPublicHttp(result.value.package),
    };
  }
}
