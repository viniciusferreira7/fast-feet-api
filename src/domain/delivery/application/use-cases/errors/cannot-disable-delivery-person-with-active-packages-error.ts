import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class CannotDisableDeliveryPersonWithActivePackagesError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Cannot disable delivery person with active packages to deliver');
  }
}
