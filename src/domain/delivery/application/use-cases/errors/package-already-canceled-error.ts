import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class PackageAlreadyCanceledErrorError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Package already canceled.');
  }
}
