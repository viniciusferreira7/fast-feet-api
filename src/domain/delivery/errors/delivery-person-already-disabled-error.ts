import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class DeliveryPersonAlreadyDisabledError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Delivery person already disabled');
  }
}
