import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class AdminPersonAlreadyExistsError
  extends Error
  implements ErrorImplementation
{
  constructor(identifier: string) {
    super(`Admin person with same ${identifier} already exists.`);
  }
}
