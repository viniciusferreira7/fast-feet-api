import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class EmailAlreadyInUseError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Email already in use');
  }
}
