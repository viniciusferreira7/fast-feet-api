import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class ExternalPasswordValidationError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Weak password');
  }
}
