import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidatePackageCodeError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Invalidate Package Code');
  }
}
