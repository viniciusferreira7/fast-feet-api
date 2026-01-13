import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class ResourceNotFoundError
  extends Error
  implements ErrorImplementation
{
  constructor(resource?: string) {
    super(resource ? `${resource} not found.` : 'resource name not found.');
  }
}
