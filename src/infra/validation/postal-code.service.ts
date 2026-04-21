import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { PostalCodeValidator } from '@/domain/delivery/application/validation/postal-code-validator';
import { ExternalPostalCodeError } from '@/domain/delivery/errors/external-postal-code-validation-error';
import { EnvService } from '../env/env.service';
import type { PostalCodeExternalServiceResponse } from '../interfaces/postal-code-external-service-response';
import { log } from '../logger';

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
      const result =
        await this.httpClient.get<PostalCodeExternalServiceResponse>(
          url.toString(),
          {
            retries: 5,
            maxTimeout: 1000,
            minTimeout: 1,
            factor: 2,
            randomize: true,
            maxRetryTime: 1200,
          }
        );

      if (result.erro) {
        return left(new ExternalPostalCodeError('Invalid postal code'));
      }

      return right({ postalCode: result.cep });
    } catch (error) {
      log.error(error, '[Postal External Service Error]');

      const message =
        error instanceof Error ? error.message : 'Invalid Postal Code';
      return left(new ExternalPostalCodeError(message));
    }
  }
}
