import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { PostalCodeValidator } from '@/domain/delivery/application/validation/postal-code-validator';
import { ExternalPostalCodeError } from '@/domain/delivery/errors/external-postal-code-validation-error';
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

    const url = new URL(`${postalCode}/json/`, postalCodeExternalService);

    try {
      const result = await this.httpClient.get<PostalCodeExternalServiceResponse>(url.toString(), {
        retries: 5,
      });

      if (result.erro) {
        return left(new ExternalPostalCodeError('Invalid postal code'));
      }

      return right({ postalCode: result.cep });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid Postal Code';
      return left(new ExternalPostalCodeError(message));
    }
  }
}
