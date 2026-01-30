import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class EmailCodeHasNotBeenVerifiedError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Email code has not been verified');
  }
}
