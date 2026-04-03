import type { Either } from '@/core/either';
import type { ExternalPostalCodeError } from '../../errors/external-postal-code-validation-error';

export abstract class PostalCodeValidator {
  abstract validate(
    postalCode: string
  ): Promise<Either<ExternalPostalCodeError, { postalCode: string }>>;
}
