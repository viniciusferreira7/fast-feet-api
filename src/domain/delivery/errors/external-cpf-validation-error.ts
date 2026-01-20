import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class ExternalCpfValidationError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('External CPF validation failed');
  }
}
