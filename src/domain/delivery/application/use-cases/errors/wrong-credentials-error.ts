import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class WrongCredentialsError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Credentials are not valid.');
  }
}
