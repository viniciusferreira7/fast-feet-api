import { type Either, right } from '@/core/either';
import type { PostalCodeValidator } from '@/domain/delivery/application/validation/postal-code-validator';
import type { ExternalPostalCodeError } from '@/domain/delivery/errors/external-postal-code-validation-error';

export class FakePostalCodeValidator implements PostalCodeValidator {
  async validate(
    _postalCode: string
  ): Promise<Either<ExternalPostalCodeError, { postalCode: string }>> {
    return right({ postalCode: _postalCode });
  }
}
