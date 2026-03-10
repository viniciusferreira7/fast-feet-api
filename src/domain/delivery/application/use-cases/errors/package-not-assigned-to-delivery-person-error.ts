import { ErrorImplementation } from '@/core/errors/error-implementation';

export class PackageNotAssignedToDeliveryPersonError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('This package is not assigned to any delivery person yet');
  }
}
