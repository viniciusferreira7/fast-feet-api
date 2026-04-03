import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class ExternalPostalCodeError
  extends Error
  implements ErrorImplementation
{
  constructor(message?: string) {
    super(message ?? 'External postal code validation failed');
  }
}
