import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class DeliveryPersonProfileIsDisableError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Delivery person profile is disabled');
  }
}
