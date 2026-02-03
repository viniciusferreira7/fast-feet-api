import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidEmailCodeExpiredError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Invalid e-mail code');
  }
}
