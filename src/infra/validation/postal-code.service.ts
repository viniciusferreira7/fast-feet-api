import { Injectable } from '@nestjs/common';
import type { Either } from '@/core/either';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { PostalCodeValidator } from '@/domain/delivery/application/validation/postal-code-validator';
import type { ExternalPostalCodeError } from '@/domain/delivery/errors/external-postal-code-validation-error';
import { EnvService } from '../env/env.service';
import type { PostalCodeExternalServiceResponse } from '../interfaces/postal-code-external-service-response';

@Injectable()
export class PostalCodeService implements PostalCodeValidator {
  constructor(
    private readonly envService: EnvService,
    private readonly httpClient: HttpClient
  ) {}

  async validate(
    postalCode: string
  ): Promise<Either<ExternalPostalCodeError, { postalCode: string }>> {
    const postalCodeExternalService = this.envService.get(
      'POSTAL_CODE_EXTERNAL_SERVICE_URL'
    );

    const url = new URL(postalCodeExternalService, `/${postalCode}/json/`);

    const result = await this.httpClient.get<PostalCodeExternalServiceResponse>(
      url.toString()
    );

    try {
      const result = fetch(`${postalCodeExternalService}`);
    } catch (error) {}
  }
}
