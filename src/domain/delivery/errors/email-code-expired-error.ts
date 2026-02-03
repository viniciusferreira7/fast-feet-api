import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class EmailCodeExpiredError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Code e-mail expired');
  }
}
