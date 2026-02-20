import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class OnlyAdminCanPerformThisActionError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Only admin can perform this action');
  }
}
