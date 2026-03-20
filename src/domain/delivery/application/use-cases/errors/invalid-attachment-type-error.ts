import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidAttachmentTypeError
  extends Error
  implements ErrorImplementation
{
  constructor(type: string) {
    super(`File type ${type} is not valid.`);
  }
}
