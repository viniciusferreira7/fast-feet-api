import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class ExternalPostCodeError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('External post code validation failed');
  }
}
