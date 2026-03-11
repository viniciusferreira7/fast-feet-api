import { ErrorImplementation } from '@/core/errors/error-implementation';

export class DeliveryPersonNotAssignedToPackageError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Delivery person is not assigned to this package');
  }
}
