import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidatePackageStatusError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Invalidate Package Status');
  }
}
