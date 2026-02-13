import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidEmailCodeError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Invalid e-mail code');
  }
}

/** @deprecated Use InvalidEmailCodeError instead */
export const InvalidEmailCodeExpiredError = InvalidEmailCodeError;
