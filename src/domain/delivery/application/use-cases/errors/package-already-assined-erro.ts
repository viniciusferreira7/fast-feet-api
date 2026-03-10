import { ErrorImplementation } from '@/core/errors/error-implementation';

export class PackageAlreadyAssignedError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('This package is already assigned to another delivery person');
  }
}
