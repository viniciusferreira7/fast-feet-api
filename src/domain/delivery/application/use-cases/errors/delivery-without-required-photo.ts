import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class DeliveryWithoutRequiredPhoto
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Delivery must include a required photo');
  }
}
