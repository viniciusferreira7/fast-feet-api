import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class MissingAttachmentError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super('Package must have an attachment to be marked as delivered');
  }
}
