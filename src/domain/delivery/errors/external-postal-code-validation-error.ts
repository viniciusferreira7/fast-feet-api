import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class ExternalPostalCodeError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('External postal code validation failed');
  }
}
